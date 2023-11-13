export async function handler (event: any, context: any): Promise<any> {
    return {
        'statusCode': 200,
        'body': 'Hello from Lambda!'
    }
}
