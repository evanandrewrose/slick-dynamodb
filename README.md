# Slick DynamoDB

[![Node.js CI](https://github.com/evanandrewrose/slick-dynamodb/actions/workflows/node.js.yml/badge.svg)](https://github.com/evanandrewrose/slick-dynamodb/actions/workflows/node.js.yml)

This is a small wrapper around the [DynamoDB Document
Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html), which
removes the burden of managing [attribute
names](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeNames.html)
and
[values](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeValues.html)
by introducing helper methods that are used in conjunction with the `SlickDynamoDB` wrapper.

See the comparison below:

```typescript
{ // dynamodb document api
  UpdateExpression: 'set path.to.#identifier = :new_count',
  ExpressionAttributeNames: {
      '#identifier': 'count'
  },
  ExpressionAttributeValues: {
      ':new_count': 1
  }
}

// is equivalent to:

{ // slick api
  UpdateExpression: ["set path.to.", n('count'), " = ", v(1)],
}
```

## Installation

```sh
npm i --save slick-dynamodb
```

## Example Usage

To use, just import the APIs as shown below and then write your expressions as a list of
strings/attributes by wrapping the attribute names with `n()` and values with `v()`.

```typescript
import { SlickDynamoDB, name as n, value as v } from "slick-dynamodb";

const user = "evan";
const client = new SlickDynamoDB(documentClient);

await client
  .update({
    TableName: "MyTable",
    Key: {
      pk: "GAME#001",
      sk: "GAME#001",
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
  })
  .promise();
```

This is equivalent to:

```typescript
await documentClient
  .update({
      {
        TableName: "MyTable",
        Key: {
          pk: "GAME#001",
          sk: "GAME#001",
        },
        UpdateExpression:
          "SET users.#user.ready = :ready " +
          "ADD version :increment",
        ConditionExpression:
          "(attribute_exists(users.#user)) " +
          "AND (#state = :state) " +
          "AND (version = :version)",
        ExpressionAttributeNames: {
          "#user": "evan",
          "#state": "state",
        },
        ExpressionAttributeValues: {
          ":ready": true,
          ":state": "WAITING",
          ":increment": 1,
          ":version": 1,
        },
        ReturnValues: "ALL_NEW",
  })
  .promise();
```

## Working with the client APIs

All of the DynamoDB Document APIs are supported. If the Document API allowed you to reference a
given input property, then SlickDynamoDB expects a `SlickExpressionInput`.

A `SlickExpressionInput` can be:

- A unary expression:
  - single attribute: `v(123)`
  - string: `"attribute_exists(foo)"`
- A composite expression:
  - attributes and strings: `['name = ', n('evan')]`
  - only attributes: `[n('foo'), n('bar')]`
- A list of composite expressions:
  - list of above expressions: `[["foo = ", n(foo)], ["bar = ", v(bar)]]`

## Passing a list of composite expressions

The rules for what happens when you pass a composite expression (2d array) depends on the type of
expressions you're working with, but they're generally what you would want if you we're sending
multiple expressions of the same type. See the below table for details:

| Type                                                              | Description                                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| UpdateExpression                                                  | Expressions are joined by a space character.                         |
| ConditionExpression, KeyConditionExpression, and FilterExpression | Expressions are joined by "AND". Each expression is wrapped with (). |
| ProjectionExpression                                              | Won't pass type check.                                               |

### Projection Expressions

Because projections are csv-lists, the API will only accept single-dimensional expressions. Below
are examples:

```typescript
ProjectionExpression: "foo"; // valid, becomes "foo"
ProjectionExpression: n("foo"); // valid, becomes "#k0", generates names {k0: "foo"}
ProjectionExpression: [n("foo"), n("bar")]; // valid, becomes "#k0, #k1", generates names {k0: "foo", k1: "bar"}
ProjectionExpression: [n("foo"), "bar"]; // valid, becomes "#k0, bar", generates names {k0: "foo"}
ProjectionExpression: [
  [n("foo"), n("bar")],
  [n("foo"), n("bar")],
]; // invalid, won't compile
```

---

This work is not affiliated, associated, authorized, endorsed by, or in any way officially connected
with Amazon, or any of its subsidiaries or its affiliates.
