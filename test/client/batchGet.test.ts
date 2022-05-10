import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { name as n, SlickDynamoDB } from "../../src";

jest.mock("aws-sdk/clients/dynamodb");

const client = new DocumentClient();

beforeEach(() => {
  jest.resetAllMocks();
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
          ProjectionExpression: [n("id"), n("name")],
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
          ProjectionExpression: [n("id"), n("name"), n("value")],
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
