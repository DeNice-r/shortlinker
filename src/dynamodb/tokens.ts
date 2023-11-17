import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

const ddbDoc = DynamoDBDocument.from(new DynamoDB({}))
const TOKENS_TABLE = process.env.TOKENS_TABLE || ''

export async function put (token: string, data: any) {
    const putOptions = {
        'TableName': TOKENS_TABLE,
        'Item': {
            'token': token,
            'userId': data.id,
            'expiresAt': data.exp
        }
    }
    await ddbDoc.put(putOptions)
    return putOptions.Item
}

export async function get (token: string) {
    const getParams = {
        'TableName': TOKENS_TABLE,
        'Key': {
            'token': token
        }
    }
    return (await ddbDoc.get(getParams)).Item
}

export async function wasIssued (token: string) {
    return Boolean(await get(token))
}

export async function deleteToken (token: string) {
    const deleteParams = {
        TableName: TOKENS_TABLE,
        Key: {
            token: token
        }
    }
    await ddbDoc.delete(deleteParams)
}
