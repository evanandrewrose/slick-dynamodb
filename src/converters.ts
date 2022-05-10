import { DynamoDB } from "aws-sdk";
import {
  SlickScanInput,
  SlickUpdateItemInput,
  SlickQueryInput,
  SlickPutItemInput,
  SingleDimensionalArrayImplies,
  SlickBatchGetItemInput,
  SlickConditionCheck,
  SlickDelete,
  SlickDeleteItemInput,
  SlickExpressionInput,
  SlickGetItemInput,
  SlickPut,
  SlickTransactGetItemsInput,
  SlickTransactWriteItemsInput,
  SlickUpdate,
  InlineAttributeName,
  InlineAttributeValue,
  SlickExpressionToken,
} from "./slickTypes";
import {
  clean,
  normalizeSlickExpressionInput,
  undefinedIfEmpty,
} from "./utils";

const GeneratedKeyPrefix = "k";

export class SlickConverter {
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
  private static spacedExpressionsAsString = (expression: string | string[]) =>
    Array.isArray(expression)
      ? expression.length === 1
        ? expression[0]
        : expression.join(" ")
      : expression;

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
      ? expression.length === 1
        ? expression[0]
        : expression.map((expression) => `(${expression})`).join(" AND ")
      : expression;

  static keyProjectionExpressionString = (
    expression: SlickExpressionInput,
    names: Record<string, string>
  ): string => {
    const projection = this.keyExpression(
      expression,
      names,
      {},
      SingleDimensionalArrayImplies.EachElementIsExpression
    );

    return this.csvExpressionsAsString(projection);
  };

  static keyCSVExpressionString = (
    expression: SlickExpressionInput,
    names: Record<string, string>,
    values: Record<string, any>
  ): string => {
    const projection = this.keyExpression(
      expression,
      names,
      values,
      SingleDimensionalArrayImplies.EachElementIsToken
    );

    return this.csvExpressionsAsString(projection);
  };

  static keyProjectionExpressionAsString = this.keyCSVExpressionString;

  static keyBooleanExpressionString = (
    expression: SlickExpressionInput,
    names: Record<string, string>,
    values: Record<string, any>
  ): string => {
    const projection = this.keyExpression(
      expression,
      names,
      values,
      SingleDimensionalArrayImplies.EachElementIsToken
    );

    return this.booleanExpressionsAsString(projection);
  };

  static keyConditionExpressionString = this.keyBooleanExpressionString;
  static keyKeyExpressionString = this.keyBooleanExpressionString;
  static keyFilterExpressionString = this.keyBooleanExpressionString;

  static keySpacedExpressionString = (
    expression: SlickExpressionInput,
    names: Record<string, string>,
    values: Record<string, any>
  ): string => {
    const projection = this.keyExpression(
      expression,
      names,
      values,
      SingleDimensionalArrayImplies.EachElementIsToken
    );

    return this.spacedExpressionsAsString(projection);
  };

  static keyUpdateExpressionString = this.keySpacedExpressionString;

  static convertToScanInput = (
    params: SlickScanInput
  ): DynamoDB.DocumentClient.ScanInput => {
    const { FilterExpression, ProjectionExpression } = params;

    const names = {};
    const values = {};

    return clean({
      ...params,
      FilterExpression:
        FilterExpression &&
        this.keyFilterExpressionString(FilterExpression, names, values),
      ProjectionExpression:
        ProjectionExpression &&
        this.keyProjectionExpressionString(ProjectionExpression, names),
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

    return clean({
      ...params,
      UpdateExpression:
        UpdateExpression &&
        this.keyUpdateExpressionString(UpdateExpression, names, values),
      ConditionExpression:
        ConditionExpression &&
        this.keyConditionExpressionString(ConditionExpression, names, values),
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

    return clean({
      ...params,
      KeyConditionExpression:
        KeyConditionExpression &&
        this.keyKeyExpressionString(KeyConditionExpression, names, values),
      FilterExpression:
        FilterExpression &&
        this.keyFilterExpressionString(FilterExpression, names, values),
      ProjectionExpression:
        ProjectionExpression &&
        this.keyProjectionExpressionString(ProjectionExpression, names),
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

    return clean({
      ...params,
      ConditionExpression:
        ConditionExpression &&
        this.keyConditionExpressionString(ConditionExpression, names, values),
      ExpressionAttributeNames: undefinedIfEmpty(names),
      ExpressionAttributeValues: undefinedIfEmpty(values),
    });
  };

  static convertToGetItemInput = (
    params: SlickGetItemInput
  ): DynamoDB.DocumentClient.GetItemInput => {
    const { ProjectionExpression } = params;

    const names = {};

    return clean({
      ...params,
      ProjectionExpression:
        ProjectionExpression &&
        this.keyProjectionExpressionString(ProjectionExpression, names),
      ExpressionAttributeNames: undefinedIfEmpty(names),
    });
  };

  static convertToDeleteItemInput = (
    params: SlickDeleteItemInput
  ): DynamoDB.DocumentClient.DeleteItemInput => {
    const { ConditionExpression } = params;

    const names = {};
    const values = {};

    return clean({
      ...params,
      ConditionExpression:
        ConditionExpression &&
        this.keyConditionExpressionString(ConditionExpression, names, values),
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

          obj[key] = clean({
            ...item,
            ProjectionExpression:
              ProjectionExpression &&
              this.keyProjectionExpressionString(ProjectionExpression, names),
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

    return clean({
      ...conditionCheck,
      ConditionExpression: this.keyConditionExpressionString(
        ConditionExpression,
        names,
        values
      ),
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

    return clean({
      ...request,
      ConditionExpression:
        ConditionExpression &&
        this.keyConditionExpressionString(ConditionExpression, names, values),
      ExpressionAttributeNames: undefinedIfEmpty(names),
      ExpressionAttributeValues: undefinedIfEmpty(values),
    });
  };

  static convertToPut = (request: SlickPut): DynamoDB.DocumentClient.Put => {
    const { ConditionExpression } = request;

    const names = {};
    const values = {};

    return clean({
      ...request,
      ConditionExpression:
        ConditionExpression &&
        this.keyConditionExpressionString(ConditionExpression, names, values),
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

    return clean({
      ...request,
      UpdateExpression: this.keyUpdateExpressionString(
        UpdateExpression,
        names,
        values
      ),
      ConditionExpression:
        ConditionExpression &&
        this.keyConditionExpressionString(ConditionExpression, names, values),
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

        return clean({
          ...item,
          Get: {
            ...item.Get,
            ProjectionExpression:
              ProjectionExpression &&
              this.keyProjectionExpressionString(ProjectionExpression, names),
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
    expression: SlickExpressionInput,
    names: Record<string, string>,
    values: Record<string, any>,
    singleDimensionalArrayImplication = SingleDimensionalArrayImplies.EachElementIsToken
  ): string | string[] => {
    const normalizedExpression = normalizeSlickExpressionInput(
      expression,
      singleDimensionalArrayImplication
    );

    return normalizedExpression.map((expression) =>
      this.keyJoinedExpression(expression, names, values)
    ) as string[];
  };

  private static keyJoinedExpression = (
    expression: SlickExpressionToken[],
    names: Record<string, string>,
    values: Record<string, any>
  ): string | string[] => {
    // Determine the final string by substituting inline attributes with the keys to them. Along the
    // way, store the keys and their associated values in names and values.
    return expression
      .map((expression): SlickExpressionToken => {
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
}
