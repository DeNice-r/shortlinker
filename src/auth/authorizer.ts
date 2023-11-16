import jwt from 'jsonwebtoken'
import process from 'process'
import { get } from '../dynamodb/users'
import { deleteToken, wasIssued } from '../dynamodb/tokens'
import { Handler } from 'aws-lambda'

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'secret'

export const handler: Handler = async (event) => {
    const authHeader: string = event.headers['authorization']
    const accessToken: string = authHeader && authHeader.split(' ')[1]
    if (!accessToken || !await wasIssued(accessToken)) {
        return {'isAuthorized': false}
    }

    try {
        const data: any = jwt.verify(accessToken, JWT_ACCESS_SECRET)
        const user = await get(data.id)
        return {
            'isAuthorized': true,
            'context': {
                'user': {
                    'id': user.id,
                    'email': user.email
                }
            }
        }
    } catch (e) {
        // Token cannot be verified so it is deleted from the database
        console.error(e)
        await deleteToken(accessToken)
        if (e instanceof jwt.TokenExpiredError) {
            // return createErrorResponse(401, 'Token expired')
        }
        return {'isAuthorized': false}
        // return createErrorResponse(500, 'Internal server error')
    }
}
