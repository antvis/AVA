# How it Works

the graph is ugly but the pipeline could be something like this:

![AVA Pipeline](https://gw.alipayobjects.com/zos/antfincdn/YBzJnTR4My/avapipeline.png)

## Data to Data Property Schema

We analyze the _properties_ and _features_ of the given dataset and record them as a schema.

```js
// This is the sample dataset:
const data = [
  {f1: "a", f2: 100},
  {f1: "b", f2: 300},
  {f1: "c", f2: 340},
  {f1: "d", f2: 630}
];

// This is the property schema of the sample dataset:
const dataPropSchema =  [
  {
    "count": 4,
    "distinct": 4,
    "type": "string",
    "recommendation": "string",
    "missing": 0,
    "rawData": [ "a", "b", "c", "d" ],
    "valueMap": { "a": 1, "b": 1, "c": 1, "d": 1 },
    "maxLength": 1,
    "minLength": 1,
    "meanLength": 1,
    "containsChar": true,
    "containsDigit": false,
    "containsSpace": false,
    "name": "f1",
    "levelOfMeasurements": [ "Nominal" ]
  },
  {
    "count": 4,
    "distinct": 4,
    "type": "integer",
    "recommendation": "integer",
    "missing": 0,
    "rawData": [ 100, 300, 340, 630 ],
    "valueMap": { "100": 1, "300": 1, "340": 1, "630": 1 },
    "minimum": 100,
    "maximum": 630,
    "mean": 342.5,
    "percentile5": 100,
    "percentile25": 100,
    "percentile50": 300,
    "percentile75": 340,
    "percentile95": 630,
    "sum": 1370,
    "variance": 35818.75,
    "standardDeviation": 189.2584212129014,
    "zeros": 0,
    "name": "f2",
    "levelOfMeasurements": [ "Interval", "Discrete" ]
  }
]
```

To get the data props schema, we can use `df.info` of DataWizard.

```js
import { DataFrame } from '@antv/data-wizard';

const df = new DataFrame(dataset);
const dataPropSchema = df.info();
```

and then add levelOfMeasurements to it.
