import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { joined as x, name as n, SlickDynamoDB, value as v } from "../../src";

jest.mock("aws-sdk/clients/dynamodb");

const client = new DocumentClient();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("SlickDynamoDB client put method", () => {
  it("handles arrays of arrays for condition expressions", () => {
    const slick = new SlickDynamoDB(client);
    slick.put({
      TableName: "table",
      Item: {
        pk: "mock_pk",
        sk: "mock_sk",
        other: "mock",
      },
      ConditionExpression: [
        [n("mock_comparison_name"), " < ", v(3)],
        [n("mock_name"), " == ", v("mock_value")],
      ],
    });

    expect(client.put).toHaveBeenCalledWith(
      {
        ConditionExpression: "(#k0 < :k0) AND (#k1 == :k1)",
        ExpressionAttributeNames: {
          "#k0": "mock_comparison_name",
          "#k1": "mock_name",
        },
        ExpressionAttributeValues: {
          ":k0": 3,
          ":k1": "mock_value",
        },
        Item: {
          other: "mock",
          pk: "mock_pk",
          sk: "mock_sk",
        },
        TableName: "table",
      },
      undefined
    );
  });

  it("handles arrays for condition expressions", () => {
    const slick = new SlickDynamoDB(client);
    slick.put({
      TableName: "table",
      Item: {
        pk: "mock_pk",
        sk: "mock_sk",
        other: "mock",
      },
      ConditionExpression: [n("mock_name"), " == ", v("mock_value")],
    });

    expect(client.put).toHaveBeenCalledWith(
      {
        ConditionExpression: "#k0 == :k0",
        ExpressionAttributeNames: {
          "#k0": "mock_name",
        },
        ExpressionAttributeValues: {
          ":k0": "mock_value",
        },
        Item: {
          other: "mock",
          pk: "mock_pk",
          sk: "mock_sk",
        },
        TableName: "table",
      },
      undefined
    );
  });

  it("generates expression attribute names and values", () => {
    const slick = new SlickDynamoDB(client);
    slick.put({
      TableName: "table",
      ReturnConsumedCapacity: "mock",
      Item: {
        pk: "mock_pk",
        sk: "mock_sk",
        other: "mock",
      },
      ConditionExpression: x(n("mock_name"), " == ", v("mock_value")),
      ReturnItemCollectionMetrics: "mock",
      ReturnValues: "ALL_OLD",
    });

    expect(client.put).toHaveBeenCalledWith(
      {
        ConditionExpression: "#k0 == :k0",
        ExpressionAttributeNames: {
          "#k0": "mock_name",
        },
        ExpressionAttributeValues: {
          ":k0": "mock_value",
        },
        Item: {
          other: "mock",
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
