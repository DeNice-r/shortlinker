import { Handler } from 'aws-lambda'

import { createDataResponse, createErrorResponse } from '../util/responses'
import { queryByUserId } from '../dynamodb/links'

export const handler: Handler = async (event) => {
    const user = event.requestContext.authorizer.lambda.user
    try {
        return createDataResponse(await queryByUserId(user.id))
    } catch (e) {
        console.error(e)
        return createErrorResponse(500, 'There was an error fetching the links')
    }
}
