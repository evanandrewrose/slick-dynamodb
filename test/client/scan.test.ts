import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { name as n, SlickDynamoDB, value as v } from "../../src";

jest.mock("aws-sdk/clients/dynamodb");

const client = new DocumentClient();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("SlickDynamoDB client scan method", () => {
  it("generates expression attribute names and values", () => {
    const slick = new SlickDynamoDB(client);
    slick.scan({
      TableName: "table",
      IndexName: "mock",
      Limit: 20,
      Select: "ALL_ATTRIBUTES",
      ExclusiveStartKey: {},
      ReturnConsumedCapacity: "mock",
      TotalSegments: 1,
      Segment: 0,
      ProjectionExpression: [n("mock_p"), n("mock_v")],
      FilterExpression: [n("mock_f"), " > ", v(3)],
      ConsistentRead: true,
    });

    expect(client.scan).toHaveBeenCalledWith(
      {
        ConsistentRead: true,
        ExclusiveStartKey: {},
        ExpressionAttributeNames: {
          "#k0": "mock_f",
          "#k1": "mock_p",
          "#k2": "mock_v",
        },
        ExpressionAttributeValues: {
          ":k0": 3,
        },
        FilterExpression: "#k0 > :k0",
        IndexName: "mock",
        Limit: 20,
        ProjectionExpression: "#k1, #k2",
        ReturnConsumedCapacity: "mock",
        Segment: 0,
        Select: "ALL_ATTRIBUTES",
        TableName: "table",
        TotalSegments: 1,
      },
      undefined
    );
  });
});
