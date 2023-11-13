import { Handler } from 'aws-lambda'

import { createErrorResponse, createMessageResponse } from '../util/response'
import { deactivate } from '../util/links'

export const handler: Handler = async (event) => {
    try {
        await deactivate(event.pathParameters.id, event.headers.userId)
        return createMessageResponse('Link deactivated successfully')
    } catch (e) {
        console.error(e)
        return createErrorResponse(500, 'There was an error fetching the link')
    }
}
