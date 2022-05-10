import { AWSError, DynamoDB } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Request } from "aws-sdk/lib/request";
import { SlickConverter } from "./converters";
import {
  InlineAttributeName,
  InlineAttributeValue,
  SlickBatchGetItemInput,
  SlickDeleteItemInput,
  SlickGetItemInput,
  SlickPutItemInput,
  SlickQueryInput,
  SlickScanInput,
  SlickTransactGetItemsInput,
  SlickTransactWriteItemsInput,
  SlickUpdateItemInput,
} from "./slickTypes";

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
   * Creates a set of elements inferring the type of set from the type of the first element. Amazon DynamoDB currently supports the number sets, string sets, and binary sets. For more information about DynamoDB data types see the documentation on the Amazon DynamoDB Data Model.
   */
  createSet = (
    list: number[] | string[] | DocumentClient.binaryType[],
    options?: DocumentClient.CreateSetOptions
  ): DocumentClient.DynamoDbSet => this.delegate.createSet(list, options);

  /**
   * Edits an existing item's attributes, or adds a new item to the table if it does not already
   * exist by delegating to AWS.DynamoDB.updateItem().
   */
  public update(
    params: SlickUpdateItemInput,
    callback?: (err: AWSError, data: DynamoDB.Types.UpdateItemOutput) => void
  ): Request<DynamoDB.DocumentClient.UpdateItemOutput, AWSError> {
    return this.delegate.update(
      SlickConverter.convertToUpdateItemInput(params),
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
      SlickConverter.convertToQueryInput(params),
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
      SlickConverter.convertToScanInput(params),
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
      SlickConverter.convertToPutItemInput(params),
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
      SlickConverter.convertToGetItemInput(params),
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
      SlickConverter.convertToDeleteItemInput(params),
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
      SlickConverter.convertToBatchGetItemInput(params),
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
      SlickConverter.convertToTransactGet(params),
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
      SlickConverter.convertToTransactWrite(params),
      callback
    );
  };
}
