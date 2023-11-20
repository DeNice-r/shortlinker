import { Handler } from 'aws-lambda'

import { createErrorResponse, createRedirectResponse } from '../util/responses'
import { get, incrementVisitCount, zeroTrustDeactivate } from '../dynamodb/links'

export const handler: Handler = async (event) => {
    const linkId = event.pathParameters.id

    try {
        const link = await get(linkId)

        if (!link || link.isActive === 0 || await deactivateIfExpired(link)) {
            return createErrorResponse(404, 'Link with the given Id does not exist or was deactivated')
        }
        await incrementVisitCount(linkId)
        return createRedirectResponse(link.origin)
    } catch (e) {
        console.error(e)
        return createErrorResponse(500, e.message)
    }
}

async function deactivateIfExpired (link: any) {
    // If link is expired, it is deactivated and true returned. If it has no expiration date, it is deactivated anyway,
    // but false is returned, as it should be treated as active until lambda execution ends
    const timestampS = Math.floor(new Date().getTime() / 1000)
    if (!link.expiresAt || link.expiresAt < timestampS) {
        await zeroTrustDeactivate(link.id, link.userId)
    }
    return link.expiresAt && link.expiresAt < timestampS
}
