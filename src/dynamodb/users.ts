import * as process from 'process'
import * as uuid from 'uuid'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

const ddbDoc = DynamoDBDocument.from(new DynamoDB({}))
const USERS_TABLE = process.env.USERS_TABLE || ''

export async function put (email: string, passwordHash: string) {
    if (await existsByEmail(email)) throw new EmailTakenError()

    const putOptions = {
        'TableName': USERS_TABLE,
        'Item': {
            'id': uuid.v4(),
            'email': email,
            'passwordHash': passwordHash
        }
    }
    await ddbDoc.put(putOptions)
    return putOptions.Item
}

export async function get (id: string) {
    const getParams = {
        'TableName': USERS_TABLE,
        'Key': {
            'id': id
        }
    }
    return (await ddbDoc.get(getParams)).Item
}

export async function queryByEmail (email: string) {
    const queryParams = {
        TableName: USERS_TABLE,
        IndexName: 'UsersByEmail',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': email
        }
    }
    return (await ddbDoc.query(queryParams)).Items[0]
}

export async function exists (id: string) {
    return Boolean(await get(id))
}

export async function existsByEmail (email: string) {
    return Boolean(await queryByEmail(email))
}

export class EmailTakenError extends Error {
    statusCode: number

    constructor (message: string = 'Email taken') {
        super(message)
        this.name = 'EmailTakenError'
        this.statusCode = 409
    }
}
