import { Handler } from 'aws-lambda'

import { createErrorResponse, createMessageResponse } from '../util/responses'
import { zeroTrustDeactivate } from '../dynamodb/links'

export const handler: Handler = async (event) => {
    const user = event.requestContext.authorizer.lambda.user
    try {
        await zeroTrustDeactivate(event.pathParameters.id, user.id)
        return createMessageResponse('Link deactivated successfully')
    } catch (e) {
        console.error(e)
    }
    return createErrorResponse(404, 'Link not found')
}
