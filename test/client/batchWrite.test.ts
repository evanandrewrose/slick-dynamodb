import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { SlickDynamoDB } from "../../src";

jest.mock("aws-sdk/clients/dynamodb");

const client = new DocumentClient();

beforeEach(() => {
  jest.resetAllMocks();
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
