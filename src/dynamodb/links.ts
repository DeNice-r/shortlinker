import * as process from 'process'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'

const ddbDoc = DynamoDBDocument.from(new DynamoDB({}))
const sqs = new SQSClient({})
const LINKS_TABLE = process.env.LINKS_TABLE || ''
const TIME_IN_A_DAY_S = 60 * 60 * 24

export async function put (token: string, userId: string, origin: string, daysToExpire: number) {
    const createdAt = Math.floor(new Date().getTime() / 1000)
    const expiresAt = daysToExpire ? createdAt + daysToExpire * TIME_IN_A_DAY_S : undefined
    const putOptions = {
        'TableName': LINKS_TABLE,
        'Item': {
            'id': token,
            'userId': userId,
            'origin': origin,
            'isActive': 1,
            'visitCount': 0,
            createdAt,
            expiresAt
        }
    }
    await ddbDoc.put(putOptions)
    return putOptions.Item
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

export async function zeroTrustDeactivate (linkId: string, userId: string) {
    const deactivateParams = {
        TableName: LINKS_TABLE,
        Key: {
            id: linkId
        },
        UpdateExpression: 'set isActive = :isActive',
        ConditionExpression: 'isActive = :one AND userId = :userId',
        ExpressionAttributeValues: {
            ':isActive': 0,
            ':one': 1,
            ':userId': userId
        },
        ReturnValues: 'ALL_NEW'
    }

    const updatedLink = (await ddbDoc.update(deactivateParams)).Item
    await sendSQSMessage(updatedLink.userId, updatedLink.origin)

    return
}

export async function deactivate (linkId: string) {
    const deactivateParams = {
        TableName: LINKS_TABLE,
        Key: {
            id: linkId
        },
        UpdateExpression: 'set isActive = :isActive',
        ConditionExpression: 'isActive = :one',
        ExpressionAttributeValues: {
            ':isActive': 0,
            ':one': 1
        },
        ReturnValues: 'ALL_NEW'
    }

    const updatedLink = (await ddbDoc.update(deactivateParams)).Attributes
    await sendSQSMessage(updatedLink.userId, updatedLink.origin)

    return updatedLink
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

async function sendSQSMessage (userId: string, origin: string) {
    const DEACTIVATION_MAIL_QUEUE_URL = process.env.DEACTIVATION_MAIL_QUEUE_URL || ''
    const message = {
        userId,
        origin
    }

    const command = new SendMessageCommand({
        QueueUrl: DEACTIVATION_MAIL_QUEUE_URL,
        MessageBody: JSON.stringify(message)
    })

    try {
        await sqs.send(command)
    } catch (e) {
        console.error(e)
    }
}
