import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { name as n, SlickDynamoDB, value as v } from "../../src";

jest.mock("aws-sdk/clients/dynamodb");

const client = new DocumentClient();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("SlickDynamoDB client query method", () => {
  it("generates expression attribute names and values", () => {
    const slick = new SlickDynamoDB(client);
    slick.query({
      TableName: "table",
      KeyConditionExpression: ["attribute_exists(", n("mock_a"), ")"],
      ConsistentRead: true,
      ExclusiveStartKey: {},
      FilterExpression: [n("mock_b"), " > ", v(3)],
      ProjectionExpression: [n("mock_c"), n("mock_d")],
      Limit: 20,
      Select: "ALL_ATTRIBUTES",
      IndexName: "mock",
      ReturnConsumedCapacity: "mock",
      ScanIndexForward: true,
    });

    expect(client.query).toHaveBeenCalledWith(
      {
        ConsistentRead: true,
        ExclusiveStartKey: {},
        ExpressionAttributeNames: {
          "#k0": "mock_a",
          "#k1": "mock_b",
          "#k2": "mock_c",
          "#k3": "mock_d",
        },
        ExpressionAttributeValues: {
          ":k0": 3,
        },
        FilterExpression: "#k1 > :k0",
        IndexName: "mock",
        KeyConditionExpression: "attribute_exists(#k0)",
        Limit: 20,
        ProjectionExpression: "#k2, #k3",
        ReturnConsumedCapacity: "mock",
        ScanIndexForward: true,
        Select: "ALL_ATTRIBUTES",
        TableName: "table",
      },
      undefined
    );
  });
});
