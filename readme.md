# Shortlinker

Shortlinker is a serverless URL shortener API built with AWS Lambda and DynamoDB. The project is written in TypeScript
and uses the Serverless Framework for deployment and infrastructure management.

## Project Structure

- `src/`: This directory contains the source code of the project. It is divided into different modules such as `auth`
  for authentication and `links` for link management.
- `serverless.yml`: This is the Serverless Framework configuration file. It defines the AWS resources that are part of
  this project.
- `serverless.doc.yml`: This file contains the documentation for the API endpoints.
- `openapi.yml`: This file contains the OpenAPI (Swagger) documentation for the API.

## How to Run

Before running the project, make sure you have Node.js and npm installed on your machine. Also, you need to have the
Serverless Framework installed globally. If not, you can install it using the following command:

```bash
npm install -g serverless
```

To run the project, follow these steps:

1. Clone the repository to your local machine.

```bash
git clone https://github.com/DeNice-r/shortlinker.git
```

2. Navigate to the project directory.

```bash
cd shortlinker
```

3. Install the project dependencies.

```bash
npm install
```

4. Set up variables, essential for the application to run in the `serverless.yml`.

| Variable                                   | Description                                                                                                                                            |
|--------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `org`                                      | The name of your organization.                                                                                                                         |
| `app`                                      | The name of your application.                                                                                                                          |
| `service`                                  | The name of your service.                                                                                                                              |
| `custom.verifiedEmail`                     | The email address that will be used to send emails.                                                                                                    |
| `provider.runtime`                         | The runtime for the Lambda functions.                                                                                                                  |
| `provider.stage`                           | The stage of the application.                                                                                                                          |
| `provider.region`                          | The AWS region where the application will be deployed.                                                                                                 |
| `provider.environment`                     | The environment variables for the Lambda functions. Most are automatically set during the deployment, but a degree of customization is also supported. |
| `resources.Recources.<TableName>.Replicas` | List of regions where the DynamoDB table will be replicated.                                                                                           |

5. Deploy the application.

```bash
serverless deploy
```

## Optional Steps

### Custom Domain along with multi-region deployment

1. Uncomment the `plugins.serverless-domain-manager` part in the `serverless.yml` file.
2. Uncomment the `custom.customDomain` section in the `serverless.yml` file.
3. Fill out the `custom.customDomain` section in the `serverless.yml` file as appropriate.
4. Deploy the application in multiple regions.

```bash
serverless deploy --region <region>
```
