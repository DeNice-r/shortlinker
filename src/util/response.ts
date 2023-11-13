export function createResponse (statusCode: number, jsonBody: any, headers: any = {}) {
    return {
        statusCode,
        headers,
        'body': JSON.stringify(jsonBody)
    }
}

export function createErrorResponse (errorStatusCode: number, message: string) {
    if (errorStatusCode < 400) {
        console.error(`Created a response with code ${errorStatusCode}, which is not considered an error.`)
    } else if (errorStatusCode >= 600) {
        console.error(`Created a response with code ${errorStatusCode}, which is not a valid HTTP response status code.`)
    }

    return createResponse(errorStatusCode, {message})
}

export function createMessageResponse (message: string) {
    return createResponse(200, {message})
}

export function createDataResponse (data: any) {
    return createResponse(200, {data})
}

export function createRedirectResponse (url: string) {
    return createResponse(302, null, { Location: url })
}
