import { SlickDynamoDB, joined as x, name as n, value as v } from "../src";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { SlickGetItemInput, SlickUpdateItemInput } from "../src/types";

jest.mock("aws-sdk/clients/dynamodb");

const client = new DocumentClient();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("SlickDynamoDB client get method", () => {
  it.each([
    {
      TableName: "table",
      Key: {
        pk: "pk",
      },
    },
    {
      TableName: "table",
      Key: {
        pk: "pk",
        sk: "sk",
      },
    },
    {
      TableName: "table",
      Key: {
        pk: "pk",
        sk: "sk",
      },
      AttributesToGet: ["one", "two", "three"],
      ConsistentRead: true,
      ReturnConsumedCapacity: "TOTAL",
    },
  ])(
    "forwards simple requests to the document client",
    (request: SlickGetItemInput) => {
      const slick = new SlickDynamoDB(client);
      slick.get(request);

      expect(client.get).toHaveBeenCalledWith(request, undefined);
    }
  );

  it("generates attribute names for a single projection expressions", () => {
    const slick = new SlickDynamoDB(client);
    slick.get({
      TableName: "table",
      Key: {
        pk: "pk",
        sk: "sk",
      },
      ProjectionExpression: x(n("id")),
    });

    expect(client.get).toHaveBeenCalledWith(
      {
        TableName: "table",
        Key: {
          pk: "pk",
          sk: "sk",
        },
        ProjectionExpression: "#k0",
        ExpressionAttributeNames: {
          "#k0": "id",
        },
      } as DocumentClient.GetItemInput,
      undefined
    );
  });

  it("generates attribute names for multiple projection expressions", () => {
    const slick = new SlickDynamoDB(client);
    slick.get({
      TableName: "table",
      Key: {
        pk: "pk",
        sk: "sk",
      },
      ProjectionExpression: [x(n("id")), x(n("name"))],
    });

    expect(client.get).toHaveBeenCalledWith(
      {
        TableName: "table",
        Key: {
          pk: "pk",
          sk: "sk",
        },
        ProjectionExpression: "#k0, #k1",
        ExpressionAttributeNames: {
          "#k0": "id",
          "#k1": "name",
        },
      } as DocumentClient.GetItemInput,
      undefined
    );
  });
});

describe("SlickDynamoDB client update method", () => {
  it.each([
    {
      TableName: "table",
      Key: {
        pk: "pk",
      },
    },
    {
      TableName: "table",
      Key: {
        pk: "pk",
        sk: "sk",
      },
    },
    {
      TableName: "table",
      Key: {
        pk: "pk",
        sk: "sk",
      },
      ReturnValues: "NONE",
      ReturnConsumedCapacity: "NONE",
      ReturnItemCollectionMetrics: "NONE",
    },
  ])(
    "forwards simple requests to the document client",
    (request: SlickUpdateItemInput) => {
      const slick = new SlickDynamoDB(client);
      slick.update(request);

      expect(client.update).toHaveBeenCalledWith(request, undefined);
    }
  );

  it("can run the readme example", () => {
    const slick = new SlickDynamoDB(client);
    const user = "evan";

    slick.update({
      TableName: "MyTable",
      Key: {
        pk: `GAME#001`,
        sk: `GAME#001`,
      },
      UpdateExpression: [
        x("SET users.", n(user), ".ready = ", v(true)),
        x("ADD version ", v(1)),
      ],
      ConditionExpression: [
        x("attribute_exists(users.", n(user), ")"),
        x(n("state"), " = ", v("WAITING")),
        x("version = ", v(1)),
      ],
      ReturnValues: "ALL_NEW",
    });

    expect(client.update).toHaveBeenCalledWith(
      {
        Key: {
          pk: "GAME#001",
          sk: "GAME#001",
        },
        UpdateExpression: "SET users.#k0.ready = :k0 ADD version :k1",
        ConditionExpression:
          "(attribute_exists(users.#k1)) AND (#k2 = :k2) AND (version = :k3)",
        ExpressionAttributeNames: {
          "#k0": "evan",
          "#k1": "evan",
          "#k2": "state",
        },
        ExpressionAttributeValues: {
          ":k0": true,
          ":k1": 1,
          ":k2": "WAITING",
          ":k3": 1,
        },
        ReturnValues: "ALL_NEW",
        TableName: "MyTable",
      },
      undefined
    );
  });

  it("generates attribute names for a single attribute", () => {
    const slick = new SlickDynamoDB(client);
    slick.update({
      TableName: "table",
      Key: {
        pk: "pk",
        sk: "sk",
      },
      ConditionExpression: x("attribute_exists(", n("mock"), ")"),
    });

    expect(client.update).toHaveBeenCalledWith(
      {
        TableName: "table",
        Key: {
          pk: "pk",
          sk: "sk",
        },
        ConditionExpression: "attribute_exists(#k0)",
        ExpressionAttributeNames: {
          "#k0": "mock",
        },
      } as DocumentClient.GetItemInput,
      undefined
    );
  });

  it("generates attribute names and values for a multiple attributes", () => {
    const slick = new SlickDynamoDB(client);
    slick.update({
      TableName: "table",
      Key: {
        pk: "pk",
        sk: "sk",
      },
      ConditionExpression: [
        x("attribute_exists(", n("mock"), ")"),
        x(n("mock"), " < ", v(3)),
      ],
    });

    expect(client.update).toHaveBeenCalledWith(
      {
        TableName: "table",
        Key: {
          pk: "pk",
          sk: "sk",
        },
        ConditionExpression: "(attribute_exists(#k0)) AND (#k1 < :k0)",
        ExpressionAttributeNames: {
          "#k0": "mock",
          "#k1": "mock",
        },
        ExpressionAttributeValues: {
          ":k0": 3,
        },
      } as DocumentClient.GetItemInput,
      undefined
    );
  });
});

describe("SlickDynamoDB client query method", () => {
  it("generates expression attribute names and values", () => {
    const slick = new SlickDynamoDB(client);
    slick.query({
      TableName: "table",
      KeyConditionExpression: x("attribute_exists(", n("mock_a"), ")"),
      ConsistentRead: true,
      ExclusiveStartKey: {},
      FilterExpression: x(n("mock_b"), " > ", v(3)),
      ProjectionExpression: [x(n("mock_c")), x(n("mock_d"))],
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
      ProjectionExpression: [x(n("mock_p")), x(n("mock_v"))],
      FilterExpression: x(n("mock_f"), " > ", v(3)),
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

describe("SlickDynamoDB client put method", () => {
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

describe("SlickDynamoDB client batchWrite method", () => {
  it("delegates to document client", () => {
    const slick = new SlickDynamoDB(client);
    slick.batchWrite({
      RequestItems: {
        table: [
          {
            DeleteRequest: {
              Key: {
                pk: "mock_pk",
                sk: "mock_sk",
              },
            },
          },
          {
            PutRequest: {
              Item: {
                pk: "mock_pk",
                sk: "mock_sk",
                other: "mock_other",
              },
            },
          },
        ],
      },
      ReturnConsumedCapacity: "mock",
      ReturnItemCollectionMetrics: "mock",
    });

    expect(client.batchWrite).toHaveBeenCalledWith(
      {
        RequestItems: {
          table: [
            {
              DeleteRequest: {
                Key: {
                  pk: "mock_pk",
                  sk: "mock_sk",
                },
              },
            },
            {
              PutRequest: {
                Item: {
                  other: "mock_other",
                  pk: "mock_pk",
                  sk: "mock_sk",
                },
              },
            },
          ],
        },
        ReturnConsumedCapacity: "mock",
        ReturnItemCollectionMetrics: "mock",
      },
      undefined
    );
  });
});

describe("SlickDynamoDB client batchGet method", () => {
  it("generates expression attribute names and values", () => {
    const slick = new SlickDynamoDB(client);
    slick.batchGet({
      RequestItems: {
        table: {
          Keys: [
            {
              pk: "mock_pk",
              sk: "mock_sk",
            },
            {
              pk: "mock_pk1",
              sk: "mock_sk1",
            },
          ],
          ConsistentRead: true,
          ProjectionExpression: [x(n("id")), x(n("name"))],
        },
        second_table: {
          Keys: [
            {
              pk: "mock_pk2",
              sk: "mock_sk3",
            },
            {
              pk: "mock_pk4",
              sk: "mock_sk5",
            },
          ],
          ConsistentRead: true,
          ProjectionExpression: [x(n("id")), x(n("name")), x(n("value"))],
        },
      },
      ReturnConsumedCapacity: "mock",
    });

    expect(client.batchGet).toHaveBeenCalledWith(
      {
        RequestItems: {
          second_table: {
            ConsistentRead: true,
            ExpressionAttributeNames: {
              "#k0": "id",
              "#k1": "name",
              "#k2": "value",
            },
            Keys: [
              {
                pk: "mock_pk2",
                sk: "mock_sk3",
              },
              {
                pk: "mock_pk4",
                sk: "mock_sk5",
              },
            ],
            ProjectionExpression: "#k0, #k1, #k2",
          },
          table: {
            ConsistentRead: true,
            ExpressionAttributeNames: {
              "#k0": "id",
              "#k1": "name",
            },
            Keys: [
              {
                pk: "mock_pk",
                sk: "mock_sk",
              },
              {
                pk: "mock_pk1",
                sk: "mock_sk1",
              },
            ],
            ProjectionExpression: "#k0, #k1",
          },
        },
        ReturnConsumedCapacity: "mock",
      },
      undefined
    );
  });
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
            ProjectionExpression: [x(n("id")), x(n("name"))],
          },
        },
        {
          Get: {
            TableName: "mock_table_2",
            Key: {
              pk: "mock_pk2",
              sk: "mock_sk3",
            },
            ProjectionExpression: [x(n("id")), x(n("name")), x(n("value"))],
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
              x("attribute_exists(", n("mock_cond_expr_attr"), ")"),
              x(n("mock_cond_expr_attr1"), " < ", v(100)),
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
              x("attribute_exists(", n("mock_delete_attr"), ")"),
              x(n("mock_delete_attr1"), " < ", v(3)),
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
              x("attribute_exists(", n("mock_put_attr"), ")"),
              x(n("mock_put_attr1"), " < ", v(42)),
              x(n("mock_put_attr2"), " = ", v("mock_put_value")),
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
              x("set ", n("update_attr"), " = ", v("update_value")),
              x("add ", n("counter"), " ", v(1)),
            ],
            ConditionExpression: [
              x("attribute_exists(", n("mock_update_cond_attr"), ")"),
              x(n("mock_cond_attr1"), " < ", v(21)),
              x(n("mock_cond_attr2"), " = ", v("mock_cond_value")),
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
