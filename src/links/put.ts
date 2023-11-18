import { Handler } from 'aws-lambda'
import { CreateScheduleCommand, SchedulerClient } from '@aws-sdk/client-scheduler'

import { URL } from 'url'
import crypto from 'crypto'

import { createDataResponse, createErrorResponse } from '../util/responses'
import { exists, put } from '../dynamodb/links'

const schedulerClient = new SchedulerClient()

const MAX_TOKEN_GENERATION_TRY_COUNT = 5
const ALLOWED_EXPIRATION_PERIODS_DAYS = [1, 3, 7]
const LINK_TOKEN_LENGTH = +(process.env.LINK_TOKEN_LENGTH || 6)

export const handler: Handler = async (event) => {
    let body: any
    try {
        body = JSON.parse(event.body)
    } catch (e) {
        return createErrorResponse(422, 'Request body unprocessable.')
    }

    const user = event.requestContext.authorizer.lambda.user
    const daysToExpire = body.daysToExpire
    const urlString = body.url
    const origin = convertIfUrlValid(urlString)

    if (daysToExpire && ALLOWED_EXPIRATION_PERIODS_DAYS.indexOf(daysToExpire) === -1) {
        return createErrorResponse(422,
            `Value ${daysToExpire} of daysToExpire is not allowed. Allowed values are: ` +
            `${ALLOWED_EXPIRATION_PERIODS_DAYS} or no value, which evaluates to a single-visit link`)
    }

    if (!origin || origin.host === event.requestContext.domainName) {
        return createErrorResponse(422, 'Invalid link')
    }

    const host = 'https://' + event.requestContext.domainName
    const stage = event.requestContext.stage

    try {
        const token = await generateUniqueToken()
        const link: any = await put(token, user.id, origin.href, daysToExpire)
        if (link.expiresAt) await scheduleDeactivation(link.id, link.expiresAt)
        return createDataResponse({
            'linkId': token,
            'link': new URL((stage !== '$default' ? stage + '/' : '') + token, host),
            'origin': origin.href
        })
    } catch (e) {
        console.error(e)
        return createErrorResponse(500, e.message)
    }
}

function convertIfUrlValid (url: string) {
    try {
        return new URL(url)
    } catch (e) {
        return undefined
    }
}

async function generateUniqueToken () {
    let token: string
    let x = 0
    do {
        token = generateToken()
        x++
    } while (x < MAX_TOKEN_GENERATION_TRY_COUNT && await exists(token))
    if (x === MAX_TOKEN_GENERATION_TRY_COUNT) {
        throw new Error('There was an error generating the token')
    }

    return token
}

function generateToken (length: number = LINK_TOKEN_LENGTH) {
    return crypto
        .randomBytes(Math.ceil(length * 3 / 4))  // Base64 symbol encodes 6/8 of a single byte, so there should be n * 6/8 bytes, which simplifies to the used expression
        .toString('base64')  // Convert to base64 encoded string, which results in almost-always N data symbols and a number of '='
        .slice(0, length)  // Truncate the string to remove useless '=', possibly along with spare symbols, ruling out possible inconsistency among generated tokens
        .replace(/\//g, '_')  // Replace '+'' and '/' with url-friendly '-' and '_'
        .replace(/\+/g, '-')
}

async function scheduleDeactivation (linkId: string, expiresAt: number) {
    const IAM_ROLE_ARN = process.env.IAM_EXECUTION_ROLE_ARN
    const CRON_DEACTIVATE_FUNCTION_ARN = process.env.CRON_DEACTIVATE_FUNCTION_ARN

    const scheduleCommand = new CreateScheduleCommand({
        Name: `${linkId}-deactivation`,
        ScheduleExpression: `at(${(new Date(expiresAt * 1000)).toISOString().substring(0, 19)})`,
        ScheduleExpressionTimezone: 'UTC',
        Target: {
            RoleArn: IAM_ROLE_ARN,
            Arn: CRON_DEACTIVATE_FUNCTION_ARN,
            Input: JSON.stringify({linkId})
        },
        FlexibleTimeWindow: {
            Mode: 'OFF'
        },
        ActionAfterCompletion: 'DELETE'
    })

    return (await schedulerClient.send(scheduleCommand)).ScheduleArn
}
