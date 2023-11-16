import { Handler } from 'aws-lambda'
import { generateHash, generateTokens, getCredentialsIfValid } from '../util/authHelper'
import { EmailTakenError, put } from '../dynamodb/users'
import { createDataResponse, createErrorResponse } from '../util/responses'

export const handler: Handler = async (event) => {
    let credentials
    try {
        credentials = getCredentialsIfValid(event.body)
    } catch (e) {
        return createErrorResponse(401, e.message)
    }

    const {email, password} = credentials
    let user: any

    try {
        const passwordHash = await generateHash(password)
        user = await put(email, passwordHash)
    } catch (e) {
        console.error(e)
        if (e instanceof EmailTakenError) {
            return createErrorResponse(e.statusCode, e.message)
        }
        return createErrorResponse(500, e.message)
    }

    return createDataResponse({id: user.id, ...await generateTokens(user.id)})
}
