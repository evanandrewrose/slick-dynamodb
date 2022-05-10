import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { name as n, SlickDynamoDB } from "../../src";

jest.mock("aws-sdk/clients/dynamodb");

const client = new DocumentClient();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("SlickDynamoDB client transactGet method", () => {
  it("generates expression attribute names and values", () => {
    const slick = new SlickDynamoDB(client);
    slick.transactGet({
      TransactItems: [
        {
          Get: {
            TableName: "mock_table",
            Key: {
              pk: "mock_pk",
              sk: "mock_sk",
            },
            ProjectionExpression: [n("id"), n("name")],
          },
        },
        {
          Get: {
            TableName: "mock_table_2",
            Key: {
              pk: "mock_pk2",
              sk: "mock_sk3",
            },
            ProjectionExpression: [n("id"), n("name"), n("value")],
          },
        },
      ],
      ReturnConsumedCapacity: "mock",
    });

    expect(client.transactGet).toHaveBeenCalledWith(
      {
        ReturnConsumedCapacity: "mock",
        TransactItems: [
          {
            Get: {
              ExpressionAttributeNames: {
                "#k0": "id",
                "#k1": "name",
              },
              Key: {
                pk: "mock_pk",
                sk: "mock_sk",
              },
              ProjectionExpression: "#k0, #k1",
              TableName: "mock_table",
            },
          },
          {
            Get: {
              ExpressionAttributeNames: {
                "#k0": "id",
                "#k1": "name",
                "#k2": "value",
              },
              Key: {
                pk: "mock_pk2",
                sk: "mock_sk3",
              },
              ProjectionExpression: "#k0, #k1, #k2",
              TableName: "mock_table_2",
            },
          },
        ],
      },
      undefined
    );
  });
});
