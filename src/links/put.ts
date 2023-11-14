import { Handler } from 'aws-lambda'

import { URL } from 'url'
import crypto from 'crypto'

import { createDataResponse, createErrorResponse } from '../util/responses'
import { exists, put } from '../dynamodb/links'

const MAX_TOKEN_GENERATION_TRY_COUNT = 5
const ALLOWED_EXPIRATION_PERIODS_DAYS = [1, 3, 7]

export const handler: Handler = async (event) => {
    let body: any
    try {
        body = JSON.parse(event.body)
    } catch (e) {
        return createErrorResponse(422, 'Request body unprocessable.')
    }

    const userId = event.headers.userId
    const daysToExpire = body.daysToExpire
    const urlString = body.url
    const origin = convertIfUrlValid(urlString)

    if (daysToExpire && ALLOWED_EXPIRATION_PERIODS_DAYS.indexOf(daysToExpire) === -1) {
        return createErrorResponse(422,
            `Value ${daysToExpire} of daysToExpire is not allowed. Allowed values are:` +
            `${ALLOWED_EXPIRATION_PERIODS_DAYS} or no value, which evaluates to a single-visit link.`)
    }

    if (!origin || origin.host === event.requestContext.domainName) {
        return createErrorResponse(422, 'Invalid link')
    }

    const host = 'https://' + event.requestContext.domainName
    const stage = event.requestContext.stage

    try {
        const token = await generateUniqueToken()
        await put(token, userId, origin.href, daysToExpire)
        return createDataResponse({'shortLink': new URL(stage + '/' + token, host)})
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

function generateToken () {
    return crypto
        .randomBytes(4)  // Generate 4 random bytes
        .toString('base64')  // Convert to base64 encoded string, which results in almost-always 6 data symbols and '=='
        .slice(0, -2)  // Truncate the string to remove useless '==', possibly along with 7-th symbol, ruling out possible inconsistency among generated tokens
        .replace(/\//g, '_')  // Replace + and / with url-friendly - and _
        .replace(/\+/g, '-')
}
