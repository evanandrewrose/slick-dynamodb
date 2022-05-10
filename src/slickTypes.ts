import { DynamoDB } from "aws-sdk";

export type SlickExpressionToken =
  | string
  | InlineAttributeName
  | InlineAttributeValue;

export enum SingleDimensionalArrayImplies {
  EachElementIsToken,
  EachElementIsExpression,
}

/**
 * A wrapper for a list of {@link SlickExpressionToken} types.
 */
export class JoinedExpression {
  public expressions: SlickExpressionToken[];

  constructor(...expressions: SlickExpressionToken[]) {
    this.expressions = expressions;
  }
}

export type SlickExpressionInput =
  | JoinedExpression
  | JoinedExpression[]
  | Array<Array<SlickExpressionToken>>
  | SlickExpressionToken
  | SlickExpressionToken[];

export type OneDimensionalSlickExpressionInput =
  | JoinedExpression
  | Array<SlickExpressionToken>
  | SlickExpressionToken
  | SlickExpressionToken[];

export type SlickUpdateItemInput = Omit<
  DynamoDB.DocumentClient.UpdateItemInput,
  | "UpdateExpression"
  | "ConditionExpression"
  | "ExpressionAttributeValues"
  | "ExpressionAttributeNames"
> & {
  UpdateExpression?: SlickExpressionInput;
  ConditionExpression?: SlickExpressionInput;
};

export type SlickScanInput = Omit<
  DynamoDB.DocumentClient.ScanInput,
  | "ProjectionExpression"
  | "FilterExpression"
  | "ExpressionAttributeValues"
  | "ExpressionAttributeNames"
> & {
  ProjectionExpression?: OneDimensionalSlickExpressionInput;
  FilterExpression?: SlickExpressionInput;
};

export type SlickPutItemInput = Omit<
  DynamoDB.DocumentClient.PutItemInput,
  | "ConditionExpression"
  | "ExpressionAttributeValues"
  | "ExpressionAttributeNames"
> & {
  ConditionExpression?: SlickExpressionInput;
};

export type SlickGetItemInput = Omit<
  DynamoDB.DocumentClient.GetItemInput,
  | "ProjectionExpression"
  | "ExpressionAttributeValues"
  | "ExpressionAttributeNames"
> & {
  ProjectionExpression?: OneDimensionalSlickExpressionInput;
};

export type SlickDeleteItemInput = Omit<
  DynamoDB.DocumentClient.DeleteItemInput,
  | "ConditionExpression"
  | "ExpressionAttributeValues"
  | "ExpressionAttributeNames"
> & {
  ConditionExpression?: SlickExpressionInput;
};

export type SlickKeysAndAttributes = Omit<
  DynamoDB.DocumentClient.KeysAndAttributes,
  "ExpressionAttributeNames" | "ProjectionExpression"
> & {
  ProjectionExpression?: OneDimensionalSlickExpressionInput;
};

export type SlickBatchGetRequestMap = { [key: string]: SlickKeysAndAttributes };

export type SlickBatchGetItemInput = Omit<
  DynamoDB.DocumentClient.BatchGetItemInput,
  "RequestItems"
> & {
  RequestItems: SlickBatchGetRequestMap;
};

export type SlickGet = Omit<
  DynamoDB.DocumentClient.Get,
  "ProjectionExpression" | "ExpressionAttributeNames"
> & {
  ProjectionExpression?: OneDimensionalSlickExpressionInput;
};

export type SlickTransactGetItem = Omit<
  DynamoDB.DocumentClient.TransactGetItem,
  "Get"
> & {
  Get: SlickGet;
};

export type SlickTransactGetItemList = SlickTransactGetItem[];

export type SlickTransactGetItemsInput = Omit<
  DynamoDB.DocumentClient.TransactGetItemsInput,
  "TransactItems"
> & {
  TransactItems: SlickTransactGetItemList;
};

export type SlickPut = Omit<
  DynamoDB.DocumentClient.Put,
  | "ConditionExpression"
  | "ExpressionAttributeNames"
  | "ExpressionAttributeValues"
> & {
  ConditionExpression?: SlickExpressionInput;
};

export type SlickDelete = Omit<
  DynamoDB.DocumentClient.Delete,
  | "ConditionExpression"
  | "ExpressionAttributeNames"
  | "ExpressionAttributeValues"
> & {
  ConditionExpression?: SlickExpressionInput;
};

export type SlickUpdate = Omit<
  DynamoDB.DocumentClient.Update,
  | "UpdateExpression"
  | "ConditionExpression"
  | "ExpressionAttributeNames"
  | "ExpressionAttributeValues"
> & {
  UpdateExpression: SlickExpressionInput;
  ConditionExpression?: SlickExpressionInput;
};

export type SlickConditionCheck = Omit<
  DynamoDB.DocumentClient.ConditionCheck,
  | "ConditionExpression"
  | "ExpressionAttributeNames"
  | "ExpressionAttributeValues"
> & {
  ConditionExpression: SlickExpressionInput;
};

export type SlickTransactWriteItem = Omit<
  DynamoDB.DocumentClient.TransactWriteItem,
  "Put" | "Delete" | "Update" | "ConditionCheck"
> & {
  ConditionCheck?: SlickConditionCheck;
  Put?: SlickPut;
  Delete?: SlickDelete;
  Update?: SlickUpdate;
};

export type SlickTransactWriteItemList = SlickTransactWriteItem[];

export type SlickTransactWriteItemsInput = Omit<
  DynamoDB.DocumentClient.TransactWriteItemsInput,
  "TransactItems"
> & {
  TransactItems: SlickTransactWriteItemList;
};

export type SlickQueryInput = Omit<
  DynamoDB.DocumentClient.QueryInput,
  | "ProjectionExpression"
  | "FilterExpression"
  | "KeyConditionExpression"
  | "ExpressionAttributeValues"
  | "ExpressionAttributeNames"
> & {
  ProjectionExpression?: OneDimensionalSlickExpressionInput;
  FilterExpression?: SlickExpressionInput;
  KeyConditionExpression: SlickExpressionInput;
};

/**
 * Represents an inline name identifier used in a {@link JoinedExpression}.
 */
export class InlineAttributeName {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

/**
 * Represents an inline value identifier used in a {@link JoinedExpression}.
 */
export class InlineAttributeValue {
  value: any;

  constructor(value: any) {
    this.value = value;
  }
}
