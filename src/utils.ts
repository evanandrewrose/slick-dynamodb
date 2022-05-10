import {
  InlineAttributeName,
  InlineAttributeValue,
  SingleDimensionalArrayImplies,
  SlickExpressionInput,
  SlickExpressionToken,
} from "./slickTypes";

// Returns true if the object is empty.
const empty = (obj: Record<any, any>) => !obj || Object.keys(obj).length == 0;

// Return undefined if the obj has no keys. Otherwise, return the object.
export const undefinedIfEmpty = (obj: Record<any, any>) =>
  empty(obj) ? undefined : obj;

// Return a new object with any undefined keys removed.
export const clean = <T>(obj: T): T => {
  const cleaned = Object.entries(obj).reduce((prev, [key, value]) => {
    if (value !== undefined) {
      (prev as any)[key] = value;
    }
    return prev;
  }, {} as T);
  return cleaned;
};

const isString = (input: any): boolean =>
  typeof input === "string" || input instanceof String;

const mapSlickExpressionInput = <T>(
  input: SlickExpressionInput,
  token: (singleToken: SlickExpressionToken) => T,
  arrayOfTokens: (arrayOfTokens: SlickExpressionToken[]) => T,
  arrayOfArrayOfTokens: (
    arrayOfArrayOfTokens: Array<SlickExpressionToken[]>
  ) => T
) => {
  if (
    input instanceof InlineAttributeName ||
    input instanceof InlineAttributeValue ||
    isString(input)
  ) {
    return token(input as SlickExpressionToken);
  } else if (input instanceof Array) {
    if (input.length === 0) {
      throw new Error(
        "Empty array cannot be converted into an expression input."
      );
    } else if (
      isString(input[0]) ||
      input[0] instanceof InlineAttributeName ||
      input[0] instanceof InlineAttributeValue
    ) {
      return arrayOfTokens(input as Array<SlickExpressionToken>);
    } else if (Array.isArray(input[0])) {
      return arrayOfArrayOfTokens(input as Array<Array<SlickExpressionToken>>);
    }
  }

  throw new Error("Invalid type mapping.");
};

/**
 * Converts a {@see SlickExpressionInput} into an Array<Array<SlickExpressionToken>>.
 *
 * @param input
 * @returns list of joined expressions
 */
export const normalizeSlickExpressionInput = (
  input: SlickExpressionInput,
  singleDimensionalArrayImplication: SingleDimensionalArrayImplies
): SlickExpressionToken[][] =>
  mapSlickExpressionInput(
    input,
    (singleToken) => [[singleToken]],
    (arrayOfTokens) => {
      switch (singleDimensionalArrayImplication) {
        case SingleDimensionalArrayImplies.EachElementIsExpression:
          return [...arrayOfTokens.map((element) => [element])];
        case SingleDimensionalArrayImplies.EachElementIsToken:
          return [arrayOfTokens];
      }
    },
    (arrayOfExpressions) => arrayOfExpressions
  );
