import { Handler } from 'aws-lambda'

import { createDataResponse, createErrorResponse } from '../util/responses'
import { queryByUserId } from '../dynamodb/links'

export const handler: Handler = async (event) => {
    try {
        return createDataResponse(await queryByUserId(event.headers.userId))
    } catch (e) {
        console.error(e)
        return createErrorResponse(500, 'There was an error fetching the links')
    }
}
