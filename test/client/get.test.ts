import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { name as n, SlickDynamoDB } from "../../src";
import { SlickGetItemInput } from "../../src/slickTypes";

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
      ProjectionExpression: [n("id")],
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
      ProjectionExpression: [n("id"), n("name")],
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
