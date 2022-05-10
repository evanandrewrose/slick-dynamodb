import { AWSError, DynamoDB } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Request } from "aws-sdk/lib/request";
import {
  InlineAttributeName,
  SlickScanInput,
  SlickUpdateItemInput,
  SlickQueryInput,
  SlickPutItemInput,
  SlickGetItemInput,
  SlickDeleteItemInput,
  SlickBatchGetItemInput,
  SlickConditionCheck,
  SlickDelete,
  SlickPut,
  SlickUpdate,
  SlickTransactWriteItemsInput,
  SlickTransactGetItemsInput,
  SlickExpression,
  InlineAttributeValue,
  JoinedExpression,
} from "./types";
import { undefinedIfEmpty, clean } from "./utils";

const GeneratedKeyPrefix = "k";

/**
 * Helper to instantiate a {@link JoinedExpression}.
 *
 * @param expressions a list of {@link SlickExpression} types (strings, {@link InlineAttributeName},
 * and {@link InlineAttributeValue}).
 * @returns a joined expression
 */
export const joined = (...expressions: SlickExpression[]) =>
  new JoinedExpression(...expressions);

/**
 * Helper to instantiate a {@link InlineAttributeName}.
 *
 * @see InlineAttributeName
 *
 * @param name a string to capture
 * @returns inline name
 */
export const name = (name: string) => new InlineAttributeName(name);

/**
 * Helper to instantiate a {@link InlineAttributeValue}.
 *
 * @see InlineAttributeValue
 *
 * @param value any serializable value to capture
 * @returns inline value
 */
export const value = (value: any) => new InlineAttributeValue(value);

export class SlickDynamoDB {
  delegate: DynamoDB.DocumentClient;

  /**
   * Create a {@link SlickDynamoDB} client that wraps a {@link DynamoDb.DocumentClient} and enables
   * making queries with inline attribute names and values.
   *
   * @example <caption>Create a client.</caption>
   * ```
   * const client = new SlickDynamoDB(ddb);
   * ```
   *
   * @param documentClient DynamoDB.DocumentClient to wrap
   * @returns client wrapper
   */
  public constructor(documentClient: DynamoDB.DocumentClient) {
    this.delegate = documentClient;
  }

  /**
   * Interpret the given {@link expression} string (or strings) as an update expression. DynamoDB
   * expects multiple boolean expressions to be "AND"ed together, with each component contained in
   * parenthesis. This is the case for both Condition Expressions and Filter Expressions.
   *
   * @param expression expression or list of expressions to join
   * @returns string form of the evaluated expresssion
   */
  private static booleanExpressionsAsString = (expression: string | string[]) =>
    Array.isArray(expression)
      ? expression.map((expression) => `(${expression})`).join(" AND ")
      : expression;

  /**
   * Interpret the given {@link expression} string (or strings) as a csv expression. DynamoDB
   * expects csv expressions to be delimited by commas. This is the case for projection expressions.
   *
   * @param expression expression or list of expressions to join
   * @returns string form of the evaluated expresssion
   */
  private static csvExpressionsAsString = (expression: string | string[]) =>
    Array.isArray(expression) ? expression.join(", ") : expression;

  /**
   * Interpret the given {@link expression} string (or strings) as an update expression. DynamoDB
   * expects space-delimited expressions.
   *
   * @param expression expression or list of expressions to join
   * @returns string form of the evaluated expresssion
   */
  private static updateExpressionsAsString = (expression: string | string[]) =>
    Array.isArray(expression) ? expression.join(" ") : expression;

  /**
   * Given a {@link JoinedExpression}, generate keys for all of the inlined attributes as per
   * DynamoDB's requirements. The key => value mappings are returned in the returned
   * {@link KeyExpressionResult.names} and {@link KeyExpressionResult.values} properties so they can
   * be forwarded along to the DynamoDB client's {@link ExpressionAttributeNames} and
   * {@link ExpressionAttributeValues} parameters.
   *
   * We also substitute these attributes for their key names and return the resulting string. If we
   * receive an array of {@link JoinedExpression}, we'll apply this operation to each of the
   * elements and return an array of {@link JoinedExpression} instead.
   *
   * The reason we modify names/values is so that you can continue calling {@link keyExpression}
   * with those objects to continue building unique keys, as is required for some dynamo APIs where
   * multiple expressions share the same attribute name and value mappings.
   *
   * @param expression tokized expression or list of expressions
   * @param names expression names to populate
   * @param values expression values to populate
   * @returns string or string[] containing the attribute mappings and the string expression (or
   * expressions in the case of multiple input expressions)
   */
  private static keyExpression = (
    expression: JoinedExpression | JoinedExpression[],
    names: Record<string, string>,
    values: Record<string, string>
  ): string | string[] => {
    if (Array.isArray(expression)) {
      // Apply this method to all of the expressions and then returned the joined result.
      return expression.map((expression) =>
        this.keyExpression(expression, names, values)
      ) as string[];
    }

    // Determine the final string by substituting inline attributes with the keys to them. Along the
    // way, store the keys and their associated values in names and values.
    return expression.expressions
      .map((expression): SlickExpression => {
        if (expression instanceof InlineAttributeName) {
          const index = Object.keys(names).length;
          const key = `#${GeneratedKeyPrefix}${index}`;
          names[key] = expression.name;
          return key;
        } else if (expression instanceof InlineAttributeValue) {
          const index = Object.keys(values).length;
          const key = `:${GeneratedKeyPrefix}${index}`;
          values[key] = expression.value;
          return key;
        } else {
          // it's a string
          return expression;
        }
      })
      .join("");
  };

  static convertToScanInput = (
    params: SlickScanInput
  ): DynamoDB.DocumentClient.ScanInput => {
    const { FilterExpression, ProjectionExpression } = params;

    const names = {};
    const values = {};

    const filter = FilterExpression
      ? this.keyExpression(FilterExpression, names, values)
      : null;
    const projection = ProjectionExpression
      ? this.keyExpression(ProjectionExpression, names, values)
      : null;

    return clean({
      ...params,
      FilterExpression: filter
        ? this.booleanExpressionsAsString(filter)
        : undefined,
      ProjectionExpression: projection
        ? this.csvExpressionsAsString(projection)
        : undefined,
      ExpressionAttributeNames: undefinedIfEmpty(names),
      ExpressionAttributeValues: undefinedIfEmpty(values),
    });
  };

  static convertToUpdateItemInput = (
    params: SlickUpdateItemInput
  ): DynamoDB.DocumentClient.UpdateItemInput => {
    const { UpdateExpression, ConditionExpression } = params;

    const names = {};
    const values = {};

    const update = UpdateExpression
      ? this.keyExpression(UpdateExpression, names, values)
      : null;
    const condition = ConditionExpression
      ? this.keyExpression(ConditionExpression, names, values)
      : null;

    return clean({
      ...params,
      UpdateExpression: update
        ? this.updateExpressionsAsString(update)
        : undefined,
      ConditionExpression: condition
        ? this.booleanExpressionsAsString(condition)
        : undefined,
      ExpressionAttributeNames: undefinedIfEmpty(names),
      ExpressionAttributeValues: undefinedIfEmpty(values),
    });
  };

  static convertToQueryInput = (
    params: SlickQueryInput
  ): DynamoDB.DocumentClient.QueryInput => {
    const { FilterExpression, KeyConditionExpression, ProjectionExpression } =
      params;

    const names = {};
    const values = {};

    const condition = this.keyExpression(KeyConditionExpression, names, values);
    const filter = FilterExpression
      ? this.keyExpression(FilterExpression, names, values)
      : null;
    const projection = ProjectionExpression
      ? this.keyExpression(ProjectionExpression, names, values)
      : undefined;

    return clean({
      ...params,
      KeyConditionExpression: this.booleanExpressionsAsString(condition),
      FilterExpression: filter
        ? this.booleanExpressionsAsString(filter)
        : undefined,
      ProjectionExpression: projection
        ? this.csvExpressionsAsString(projection)
        : undefined,
      ExpressionAttributeNames: undefinedIfEmpty(names),
      ExpressionAttributeValues: undefinedIfEmpty(values),
    });
  };

  static convertToPutItemInput = (
    params: SlickPutItemInput
  ): DynamoDB.DocumentClient.PutItemInput => {
    const { ConditionExpression } = params;

    const names = {};
    const values = {};

    const condition = ConditionExpression
      ? this.keyExpression(ConditionExpression, names, values)
      : null;

    return clean({
      ...params,
      ConditionExpression: condition
        ? this.booleanExpressionsAsString(condition)
        : undefined,
      ExpressionAttributeNames: undefinedIfEmpty(names),
      ExpressionAttributeValues: undefinedIfEmpty(values),
    });
  };

  static convertToGetItemInput = (
    params: SlickGetItemInput
  ): DynamoDB.DocumentClient.GetItemInput => {
    const { ProjectionExpression } = params;

    const names = {};

    const projection = ProjectionExpression
      ? this.keyExpression(ProjectionExpression, names, {})
      : null;

    return clean({
      ...params,
      ProjectionExpression: projection
        ? this.csvExpressionsAsString(projection)
        : undefined,
      ExpressionAttributeNames: undefinedIfEmpty(names),
    });
  };

  static convertToDeleteItemInput = (
    params: SlickDeleteItemInput
  ): DynamoDB.DocumentClient.DeleteItemInput => {
    const { ConditionExpression } = params;

    const names = {};
    const values = {};

    const condition = ConditionExpression
      ? this.keyExpression(ConditionExpression, names, values)
      : null;

    return clean({
      ...params,
      ConditionExpression: condition
        ? this.booleanExpressionsAsString(condition)
        : undefined,
      ExpressionAttributeNames: undefinedIfEmpty(names),
      ExpressionAttributeValues: undefinedIfEmpty(values),
    });
  };

  static convertToBatchGetItemInput = (
    params: SlickBatchGetItemInput
  ): DynamoDB.DocumentClient.BatchGetItemInput => {
    const requestItems: DynamoDB.DocumentClient.BatchGetRequestMap =
      Object.entries(params.RequestItems).reduce(
        (obj: DynamoDB.DocumentClient.BatchGetRequestMap, [key, item]) => {
          const { ProjectionExpression } = item;
          const names = {};

          const projection = ProjectionExpression
            ? this.keyExpression(ProjectionExpression, names, {})
            : null;

          obj[key] = clean({
            ...item,
            ProjectionExpression: projection
              ? this.csvExpressionsAsString(projection)
              : undefined,
            ExpressionAttributeNames: undefinedIfEmpty(names),
          });

          return obj;
        },
        {}
      );

    return {
      ...params,
      RequestItems: requestItems,
    };
  };

  static convertToConditionCheck = (
    conditionCheck: SlickConditionCheck
  ): DynamoDB.DocumentClient.ConditionCheck => {
    const { ConditionExpression } = conditionCheck;

    const names = {};
    const values = {};

    const condition = this.keyExpression(ConditionExpression, names, values);

    return clean({
      ...conditionCheck,
      ConditionExpression: this.booleanExpressionsAsString(condition),
      ExpressionAttributeNames: undefinedIfEmpty(names),
      ExpressionAttributeValues: undefinedIfEmpty(values),
    });
  };

  static convertToDelete = (
    request: SlickDelete
  ): DynamoDB.DocumentClient.Delete => {
    const { ConditionExpression } = request;

    const names = {};
    const values = {};

    const condition = ConditionExpression
      ? this.keyExpression(ConditionExpression, names, values)
      : null;

    return clean({
      ...request,
      ConditionExpression: condition
        ? this.booleanExpressionsAsString(condition)
        : undefined,
      ExpressionAttributeNames: undefinedIfEmpty(names),
      ExpressionAttributeValues: undefinedIfEmpty(values),
    });
  };

  static convertToPut = (request: SlickPut): DynamoDB.DocumentClient.Put => {
    const { ConditionExpression } = request;

    const names = {};
    const values = {};

    const condition = ConditionExpression
      ? this.keyExpression(ConditionExpression, names, values)
      : null;

    return clean({
      ...request,
      ConditionExpression: condition
        ? this.booleanExpressionsAsString(condition)
        : undefined,
      ExpressionAttributeNames: undefinedIfEmpty(names),
      ExpressionAttributeValues: undefinedIfEmpty(values),
    });
  };

  static convertToUpdate = (
    request: SlickUpdate
  ): DynamoDB.DocumentClient.Update => {
    const { ConditionExpression, UpdateExpression } = request;

    const names = {};
    const values = {};

    const update = this.keyExpression(UpdateExpression, names, values);

    const condition = ConditionExpression
      ? this.keyExpression(ConditionExpression, names, values)
      : null;

    return clean({
      ...request,
      UpdateExpression: this.updateExpressionsAsString(update),
      ConditionExpression: condition
        ? this.booleanExpressionsAsString(condition)
        : undefined,
      ExpressionAttributeNames: undefinedIfEmpty(names),
      ExpressionAttributeValues: undefinedIfEmpty(values),
    });
  };

  static convertToTransactWrite = (
    params: SlickTransactWriteItemsInput
  ): DynamoDB.DocumentClient.TransactWriteItemsInput => {
    const itemList: DynamoDB.DocumentClient.TransactWriteItemList =
      params.TransactItems.map((item) => {
        const { ConditionCheck, Delete, Put, Update } = item;

        return clean({
          ...item,
          ConditionCheck: ConditionCheck
            ? this.convertToConditionCheck(ConditionCheck)
            : undefined,
          Delete: Delete ? this.convertToDelete(Delete) : undefined,
          Put: Put ? this.convertToPut(Put) : undefined,
          Update: Update ? this.convertToUpdate(Update) : undefined,
        });
      });

    return clean({
      ...params,
      TransactItems: itemList,
    });
  };

  static convertToTransactGet = (
    params: SlickTransactGetItemsInput
  ): DynamoDB.DocumentClient.TransactGetItemsInput => {
    const itemList: DynamoDB.DocumentClient.TransactGetItemList =
      params.TransactItems.map((item) => {
        const { ProjectionExpression } = item.Get;
        const names = {};

        const projection = ProjectionExpression
          ? this.keyExpression(ProjectionExpression, names, {})
          : null;

        return clean({
          ...item,
          Get: {
            ...item.Get,
            ProjectionExpression: projection
              ? this.csvExpressionsAsString(projection)
              : undefined,
            ExpressionAttributeNames: undefinedIfEmpty(names),
          },
        });
      });

    return clean({
      ...params,
      TransactItems: itemList,
    });
  };

  /**
   * Edits an existing item's attributes, or adds a new item to the table if it does not already
   * exist by delegating to AWS.DynamoDB.updateItem().
   */
  public update(
    params: SlickUpdateItemInput,
    callback?: (err: AWSError, data: DynamoDB.Types.UpdateItemOutput) => void
  ): Request<DynamoDB.DocumentClient.UpdateItemOutput, AWSError> {
    return this.delegate.update(
      SlickDynamoDB.convertToUpdateItemInput(params),
      callback
    );
  }

  /**
   * Returns one or more items and item attributes by accessing every item in a table or a secondary
   * index.
   */
  public query = (
    params: SlickQueryInput,
    callback?: (err: AWSError, data: DocumentClient.QueryOutput) => void
  ): Request<DocumentClient.QueryOutput, AWSError> => {
    return this.delegate.query(
      SlickDynamoDB.convertToQueryInput(params),
      callback
    );
  };

  /**
   * Returns one or more items and item attributes by accessing every item in a table or a secondary
   * index.
   */
  public scan = (
    params: SlickScanInput,
    callback?: (err: AWSError, data: DocumentClient.ScanOutput) => void
  ): Request<DocumentClient.ScanOutput, AWSError> => {
    return this.delegate.scan(
      SlickDynamoDB.convertToScanInput(params),
      callback
    );
  };

  /**
   * Creates a new item, or replaces an old item with a new item by delegating to
   * AWS.DynamoDB.putItem().
   */
  public put = (
    params: SlickPutItemInput,
    callback?: (err: AWSError, data: DocumentClient.PutItemOutput) => void
  ): Request<DocumentClient.PutItemOutput, AWSError> => {
    return this.delegate.put(
      SlickDynamoDB.convertToPutItemInput(params),
      callback
    );
  };

  /**
   * Returns a set of attributes for the item with the given primary key by delegating to
   * AWS.DynamoDB.getItem().
   */
  public get = (
    params: SlickGetItemInput,
    callback?: (err: AWSError, data: DocumentClient.GetItemOutput) => void
  ): Request<DocumentClient.GetItemOutput, AWSError> => {
    return this.delegate.get(
      SlickDynamoDB.convertToGetItemInput(params),
      callback
    );
  };

  /**
   * Deletes a single item in a table by primary key by delegating to AWS.DynamoDB.deleteItem().
   */
  public delete = (
    params: SlickDeleteItemInput,
    callback?: (err: AWSError, data: DocumentClient.DeleteItemOutput) => void
  ): Request<DocumentClient.DeleteItemOutput, AWSError> => {
    return this.delegate.delete(
      SlickDynamoDB.convertToDeleteItemInput(params),
      callback
    );
  };

  /**
   * Puts or deletes multiple items in one or more tables by delegating to
   * AWS.DynamoDB.batchWriteItem().
   */
  public batchWrite = (
    params: DynamoDB.DocumentClient.BatchWriteItemInput,
    callback?: (
      err: AWSError,
      data: DocumentClient.BatchWriteItemOutput
    ) => void
  ): Request<DocumentClient.BatchWriteItemOutput, AWSError> => {
    return this.delegate.batchWrite(params, callback);
  };

  /**
   * Puts or deletes multiple items in one or more tables by delegating to
   * AWS.DynamoDB.batchWriteItem().
   */
  public batchGet = (
    params: SlickBatchGetItemInput,
    callback?: (err: AWSError, data: DocumentClient.BatchGetItemOutput) => void
  ): Request<DocumentClient.BatchGetItemOutput, AWSError> => {
    return this.delegate.batchGet(
      SlickDynamoDB.convertToBatchGetItemInput(params),
      callback
    );
  };

  /**
   * Atomically retrieves multiple items from one or more tables (but not from indexes) in a single
   * account and region.
   */
  public transactGet = (
    params: SlickTransactGetItemsInput,
    callback?: (
      err: AWSError,
      data: DocumentClient.TransactGetItemsOutput
    ) => void
  ): Request<DocumentClient.TransactGetItemsOutput, AWSError> => {
    return this.delegate.transactGet(
      SlickDynamoDB.convertToTransactGet(params),
      callback
    );
  };

  /**
   * Synchronous write operation that groups up to 25 action requests.
   */
  public transactWrite = (
    params: SlickTransactWriteItemsInput,
    callback?: (
      err: AWSError,
      data: DocumentClient.TransactWriteItemsOutput
    ) => void
  ): Request<DocumentClient.TransactWriteItemsOutput, AWSError> => {
    return this.delegate.transactWrite(
      SlickDynamoDB.convertToTransactWrite(params),
      callback
    );
  };
}
