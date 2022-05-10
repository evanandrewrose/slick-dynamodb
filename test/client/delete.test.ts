import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { joined as x, name as n, SlickDynamoDB, value as v } from "../../src";

jest.mock("aws-sdk/clients/dynamodb");

const client = new DocumentClient();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("SlickDynamoDB client delete method", () => {
  it("generates expression attribute names and values", () => {
    const slick = new SlickDynamoDB(client);
    slick.delete({
      TableName: "table",
      ReturnConsumedCapacity: "mock",
      Key: {
        pk: "mock_pk",
        sk: "mock_sk",
      },
      ConditionExpression: x(n("mock_name"), " == ", v("mock_value")),
      ReturnItemCollectionMetrics: "mock",
      ReturnValues: "ALL_OLD",
    });

    expect(client.delete).toHaveBeenCalledWith(
      {
        ConditionExpression: "#k0 == :k0",
        ExpressionAttributeNames: {
          "#k0": "mock_name",
        },
        ExpressionAttributeValues: {
          ":k0": "mock_value",
        },
        Key: {
          pk: "mock_pk",
          sk: "mock_sk",
        },
        ReturnConsumedCapacity: "mock",
        ReturnItemCollectionMetrics: "mock",
        ReturnValues: "ALL_OLD",
        TableName: "table",
      },
      undefined
    );
  });
});
