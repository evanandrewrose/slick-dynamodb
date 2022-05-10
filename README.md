# Slick DynamoDB

This is a small wrapper around the [DynamoDB Document
Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html), which
removes the burden of managing attribute names and values by introducing helper methods that are
used in conjunction with the wrapper.

The recommended usage is that users wrap expressions with `x()` (imported alias) and then wrap their
attribute names with `n()` and values with `v()`. So:

```typescript
{
  UpdateExpression: 'set path.to.#identifier = :new_count',
  ExpressionAttributeNames: {
      '#identifier': 'count'
  },
  ExpressionAttributeValues: {
      ':new_count': 1
  }
}
```

becomes:

```typescript
{
  UpdateExpression: x("set path.to.", n('count'), " = ", v(1)),
}
```

These expressions can be referred to as "`x()`-expressions".

## Example

```typescript
import {
  SlickDynamoDB,
  joined as x,
  name as n,
  value as v,
} from "slick-dynamodb";

const user = "evan";
const client = new SlickDynamoDB(documentClient);

await client
  .update({
    TableName: "MyTable",
    Key: {
      pk: `GAME#001`,
      sk: `GAME#001`,
    },
    UpdateExpression: [
      x("SET users.", n(user), ".ready = ", v(true)),
      x("ADD version ", v(1)),
    ],
    ConditionExpression: [
      x("attribute_exists(users.", n(user), ")"),
      x(n("state"), " = ", v("WAITING")),
      x("version = ", v(1)),
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

## Other APIs

All of the DynamoDB Document APIs are supported. If the Document API allowed you to reference a
given input property, then SlickDynamoDB expects an "`x()`-expression".

## Passing arrays of "`x()`-expressions"

For all of the expression input properties, you can either pass an array of "`x()`-expressions" or
a single "`x()`-expression".

The rules for what happens when you pass an array depends on the type of expressions you're working
with, but they're generally what you would want if you we're sending multiple expressions of the
type. See the below table for details:

| Type                                                              | Description                                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| UpdateExpression                                                  | Expressions are joined by a space character.                         |
| ConditionExpression, KeyConditionExpression, and FilterExpression | Expressions are joined by "AND". Each expression is wrapped with (). |
| ProjectionExpression                                              | Expressions are joined by a comma.                                   |

---

`I am` / `this work is` not affiliated, associated, authorized, endorsed by, or in any way
officially connected with Amazon, or any of its subsidiaries or its affiliates.
