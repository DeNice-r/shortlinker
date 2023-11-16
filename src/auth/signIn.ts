import { compare } from 'bcryptjs'
import { queryByEmail } from '../dynamodb/users'
import { generateHash, generateTokens, getCredentialsIfValid } from '../util/authHelper'
import { Handler } from 'aws-lambda'
import { createDataResponse, createErrorResponse } from '../util/responses'

const invalidCredentialsResponse = createErrorResponse(401, 'Invalid credentials')

export const handler: Handler = async (event) => {
    let credentials
    try {
        credentials = getCredentialsIfValid(event.body)
    } catch (e) {
        return createErrorResponse(401, e.message)
    }

    const {email, password} = credentials

    let user: any
    let passwordHash: string
    try {
        const results = await Promise.all([queryByEmail(email), generateHash(password)])
        user = results[0]
        passwordHash = results[1]
        if (!user || !passwordHash) return invalidCredentialsResponse
    } catch (e) {
        return invalidCredentialsResponse
    }

    if (!await compare(password, passwordHash)) {
        return invalidCredentialsResponse
    }

    return createDataResponse({id: user.id, ...await generateTokens(user.id)})
}
