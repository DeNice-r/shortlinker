import * as process from 'process'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

const LINKS_TABLE = process.env.LINKS_TABLE || ''
const TIME_IN_A_DAY_MS = 1000 * 60 * 60 * 24

const ddbDoc = DynamoDBDocument.from(new DynamoDB({}))

export async function put (token: string, userId: string, origin: string, daysToExpire: number) {
    const timestampMs = new Date().getTime()
    const putOptions = {
        'TableName': LINKS_TABLE,
        'Item': {
            'id': token,
            'userId': userId,
            'origin': origin,
            'isActive': 1,
            'visitCount': 0,
            'createdAt': timestampMs,
            'expiresAt': daysToExpire ? timestampMs + TIME_IN_A_DAY_MS * daysToExpire : undefined
        }
    }
    return (await ddbDoc.put(putOptions)).ConsumedCapacity
}

export async function queryByUserId (userId: string) {
    const queryByUserIdParams = {
        TableName: LINKS_TABLE,
        IndexName: 'LinksByUserId',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }
    return (await ddbDoc.query(queryByUserIdParams)).Items
}

export async function get (linkId: string) {
    const getParams = {
        'TableName': LINKS_TABLE,
        'Key': {
            'id': linkId
        }
    }
    return (await ddbDoc.get(getParams)).Item
}

export async function exists (linkId: string) {
    return Boolean(await get(linkId))
}

export async function deactivate (linkId: string, userId: string) {
    const deactivateParams = {
        TableName: LINKS_TABLE,
        Key: {
            id: linkId
        },
        UpdateExpression: 'set isActive = :isActive',
        ConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':isActive': 0,
            ':userId': userId
        },
        ReturnValues: 'ALL_NEW'
    }
    return (await ddbDoc.update(deactivateParams)).Item
}

export async function incrementVisitCount (linkId: string) {
    const incrementVisitCountParams = {
        TableName: LINKS_TABLE,
        Key: {
            'id': linkId
        },
        FilterExpression: 'isActive = 1',
        UpdateExpression: 'SET visitCount = visitCount + :one',
        ExpressionAttributeValues: {
            ':one': 1
        },
        ReturnValues: 'ALL_NEW'
    }
    return (await ddbDoc.update(incrementVisitCountParams)).Item
}
