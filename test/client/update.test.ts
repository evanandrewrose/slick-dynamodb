import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { name as n, SlickDynamoDB, value as v } from "../../src";
import { SlickUpdateItemInput } from "../../src/slickTypes";

jest.mock("aws-sdk/clients/dynamodb");

const client = new DocumentClient();

beforeEach(() => {
  jest.resetAllMocks();
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
        ["SET users.", n(user), ".ready = ", v(true)],
        ["ADD version ", v(1)],
      ],
      ConditionExpression: [
        ["attribute_exists(users.", n(user), ")"],
        [n("state"), " = ", v("WAITING")],
        ["version = ", v(1)],
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
      ConditionExpression: ["attribute_exists(", n("mock"), ")"],
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
        ["attribute_exists(", n("mock"), ")"],
        [n("mock"), " < ", v(3)],
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
