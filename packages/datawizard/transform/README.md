# Transform

## Install

### npm

```shell
npm install @antv/dw-transform
```

### yarn

```shell
yarn add @antv/dw-transform
```

## Schema

```js
{
  "groupBy": [...],
  "actions": [
    {
      "type": ...,
      "field": ...,
      "as": ...,
      "options": {
        ...,
      }
    }
  ]
}
```

## Usage

### autoTransform

The `autoTransform` function generates transform schemas to aggregate data fields in a default way.

```ts
const data = [
  { gender: 'Male', height: 180 },
  { gender: 'Female', height: 165 },
  { gender: 'Male', height: 170 },
];

const { result, schemas } = autoTransform(data);

console.log(schemas);
// [
//   {
//     groupBy: ['gender'],
//     actions: [
//       {
//         type: 'sum',
//         field: 'height',
//         as: 'SUM(height)',
//       },
//     ],
//   },
// ]

console.log(result);
// [
//   { gender: 'Male', 'SUM(height)': 350 },
//   { gender: 'Female', 'SUM(height)': 165 },
// ]
```

#### renameOption

The `renameOption` parameter of the `autoTransform` function defines how the created aggregation field would be named.

Say, field title is `field1` and aggregation type is `sum`:

|            renameOption            |          as          |
| :--------------------------------: | :------------------: |
| `'brackets'` (default) <br> `true` |   `'SUM(field1)'`    |
|           `'underline'`            |    `'SUM_field1'`    |
|      `'origin'` <br> `false`       |      `'field1'`      |
|        *function* `f(a,b)`         | `f('field1', 'sum')` |

```ts
const data = [
  { gender: 'Male', height: 180 },
  { gender: 'Female', height: 165 },
  { gender: 'Male', height: 170 },
];

const { result, schemas } = autoTransform(data, false);

console.log(schemas);
// [
//   {
//     groupBy: ['gender'],
//     actions: [
//       {
//         type: 'sum',
//         field: 'height',
//         as: 'height',        // as origin
//       },
//     ],
//   },
// ]

console.log(result);
// [
//   { gender: 'Male', 'height': 350 },         // as origin
//   { gender: 'Female', 'height': 165 },       // as origin
// ]
```

### parse

If you already have a dataset and a transform schema for it, you can use the function `parse` to get the result.

```ts
const data = [
  { id: '1', height: 10.5, weight: 60 },
  { id: '2', height: null, weight: 40 },
  { id: '3', height: 9.5, weight: null },
  { id: '', height: 9.5, weight: 80 },
  { id: '5', height: 9.5 },
];

const schema = {
  actions: [
    {
      type: 'removeNull',
      field: 'id',
      as: null,
    },
  ],
}

const result = parse(data, schema);
// [
//   { id: '1', height: 10.5, weight: 60 },
//   { id: '2', height: null, weight: 40 },
//   { id: '3', height: 9.5, weight: null },
//   { id: '5', height: 9.5 },
// ]
```
