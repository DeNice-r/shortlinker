import { Handler } from 'aws-lambda'
import { createErrorResponse } from '../util/responses'
import { SendEmailCommand, SESv2 } from '@aws-sdk/client-sesv2'
import { get } from '../dynamodb/users'

const VERIFIED_EMAIL = process.env.VERIFIED_EMAIL
const MAIN_REGION = process.env.MAIN_REGION
const ses = new SESv2({region: MAIN_REGION})

export const handler: Handler = async (event) => {
    const records = event.Records
    let promises: Promise<any>[] = []

    for (const record of records) {
        const message = JSON.parse(record.body)
        const {userId, origin} = message

        const email = (await get(userId)).email

        try {
            promises.push(sendEmail(email, origin))
        } catch (error) {
            console.error(error)
            return createErrorResponse(500, 'Internal Server Error')
        }
    }

    await Promise.all(promises)
}

async function sendEmail (email: string, origin: string) {
    const sendCommand = new SendEmailCommand({
        Destination: {
            ToAddresses: [email]
        }, Content: {
            Simple: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: `<html><body><h1>Hi ${email}</h1><p>Your <a href="${origin}">shortened link</a> has been deactivated.</p></body></html>`
                    }
                }, Subject: {
                    Charset: 'UTF-8', Data: 'One of your links has been deactivated.'
                }
            }
        }, FromEmailAddress: VERIFIED_EMAIL
    })

    try {
        return await ses.send(sendCommand)
    } catch (e) {
        console.error(e)
    }
}
