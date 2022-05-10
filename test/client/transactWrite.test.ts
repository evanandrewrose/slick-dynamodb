import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { name as n, SlickDynamoDB, value as v } from "../../src";

jest.mock("aws-sdk/clients/dynamodb");

const client = new DocumentClient();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("SlickDynamoDB client transactWrite method", () => {
  it("generates expression attribute names and values", () => {
    const slick = new SlickDynamoDB(client);
    slick.transactWrite({
      ReturnConsumedCapacity: "mock",
      ReturnItemCollectionMetrics: "mock",
      TransactItems: [
        {
          ConditionCheck: {
            TableName: "mock_table",
            Key: {
              pk: "mock_pk",
              sk: "mock_sk",
            },
            ConditionExpression: [
              ["attribute_exists(", n("mock_cond_expr_attr"), ")"],
              [n("mock_cond_expr_attr1"), " < ", v(100)],
            ],
            ReturnValuesOnConditionCheckFailure: "mock",
          },
          Delete: {
            TableName: "mock_table",
            Key: {
              pk: "mock_pk",
              sk: "mock_sk",
            },
            ConditionExpression: [
              ["attribute_exists(", n("mock_delete_attr"), ")"],
              [n("mock_delete_attr1"), " < ", v(3)],
            ],
            ReturnValuesOnConditionCheckFailure: "mock",
          },
        },
        {
          Put: {
            TableName: "mock_table_2",
            Item: {
              pk: "mock_pk2",
              sk: "mock_sk3",
              other: "mock_other",
            },
            ConditionExpression: [
              ["attribute_exists(", n("mock_put_attr"), ")"],
              [n("mock_put_attr1"), " < ", v(42)],
              [n("mock_put_attr2"), " = ", v("mock_put_value")],
            ],
          },
        },
        {
          Update: {
            TableName: "mock_table_2",
            Key: {
              pk: "mock_pk3",
              sk: "mock_sk4",
            },
            UpdateExpression: [
              ["set ", n("update_attr"), " = ", v("update_value")],
              ["add ", n("counter"), " ", v(1)],
            ],
            ConditionExpression: [
              ["attribute_exists(", n("mock_update_cond_attr"), ")"],
              [n("mock_cond_attr1"), " < ", v(21)],
              [n("mock_cond_attr2"), " = ", v("mock_cond_value")],
            ],
            ReturnValuesOnConditionCheckFailure: "mock",
          },
        },
      ],
    });

    expect(client.transactWrite).toHaveBeenCalledWith(
      {
        ReturnConsumedCapacity: "mock",
        ReturnItemCollectionMetrics: "mock",
        TransactItems: [
          {
            ConditionCheck: {
              ConditionExpression: "(attribute_exists(#k0)) AND (#k1 < :k0)",
              ExpressionAttributeNames: {
                "#k0": "mock_cond_expr_attr",
                "#k1": "mock_cond_expr_attr1",
              },
              ExpressionAttributeValues: {
                ":k0": 100,
              },
              Key: {
                pk: "mock_pk",
                sk: "mock_sk",
              },
              ReturnValuesOnConditionCheckFailure: "mock",
              TableName: "mock_table",
            },
            Delete: {
              ConditionExpression: "(attribute_exists(#k0)) AND (#k1 < :k0)",
              ExpressionAttributeNames: {
                "#k0": "mock_delete_attr",
                "#k1": "mock_delete_attr1",
              },
              ExpressionAttributeValues: {
                ":k0": 3,
              },
              Key: {
                pk: "mock_pk",
                sk: "mock_sk",
              },
              ReturnValuesOnConditionCheckFailure: "mock",
              TableName: "mock_table",
            },
          },
          {
            Put: {
              ConditionExpression:
                "(attribute_exists(#k0)) AND (#k1 < :k0) AND (#k2 = :k1)",
              ExpressionAttributeNames: {
                "#k0": "mock_put_attr",
                "#k1": "mock_put_attr1",
                "#k2": "mock_put_attr2",
              },
              ExpressionAttributeValues: {
                ":k0": 42,
                ":k1": "mock_put_value",
              },
              Item: {
                other: "mock_other",
                pk: "mock_pk2",
                sk: "mock_sk3",
              },
              TableName: "mock_table_2",
            },
          },
          {
            Update: {
              ConditionExpression:
                "(attribute_exists(#k2)) AND (#k3 < :k2) AND (#k4 = :k3)",
              ExpressionAttributeNames: {
                "#k0": "update_attr",
                "#k1": "counter",
                "#k2": "mock_update_cond_attr",
                "#k3": "mock_cond_attr1",
                "#k4": "mock_cond_attr2",
              },
              ExpressionAttributeValues: {
                ":k0": "update_value",
                ":k1": 1,
                ":k2": 21,
                ":k3": "mock_cond_value",
              },
              Key: {
                pk: "mock_pk3",
                sk: "mock_sk4",
              },
              ReturnValuesOnConditionCheckFailure: "mock",
              TableName: "mock_table_2",
              UpdateExpression: "set #k0 = :k0 add #k1 :k1",
            },
          },
        ],
      },
      undefined
    );
  });
});
