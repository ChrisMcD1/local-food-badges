import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import DynamoDB, { PutItemInput } from "aws-sdk/clients/dynamodb";
import { z } from "zod";

const userBadgeTable = new DynamoDB({
    region: "us-east-1"
});

const schema = z.object({
    username: z.string(),
    restrauntID: z.string(),
    purchases: z.array(z.object({
        itemName: z.string(),
        quantity: z.string()
    }))
});

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log(event);
        const inputResult = schema.safeParse(
            JSON.parse(
                event.body ?? ""
            )
        );
        if (!inputResult.success) {
            return {
                statusCode: 400,
                body: JSON.stringify(inputResult.error)
            }
        }
        const input = inputResult.data;


        const putInputs: PutItemInput = {
            TableName: process.env.USER_BADGE_TABLE!,
            Item: {
                partitionKey: { S: `USER#${input.username}` },
                sortKey: { S: `VISIT#${input.restrauntID}` },
                purchases: { S: JSON.stringify(input.purchases) }
            }
        }

        console.log(putInputs);
        const putResult = await userBadgeTable.putItem(putInputs).promise();
        console.log(putResult);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "We successfully wrote to dynamodb!"
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
