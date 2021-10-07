
# API

## Advisor

Advisor of `@antv/chart-advisor` is able to advise charts based on the given data and options.

### Initialization


```typescript
import { Advisor } from '@antv/chart-advisor';

const advisor = Advisor({ckbConfig?: {...}, ruleConfig?: { ... }});
```

The above code returns an Advisor instance with specified configuration.

**ckbConfig** `optional`     
the configuration of the chart knowledge base used for the recommendation, `@antv/ckb` is used as default. Users can determine whether to include some charts only, or exclude some charts, or even customized new charts.
​

**ckbConfig.exclude** `optional`   
`string[]`  
ID of charts to exclude in the default CKB from `@antv/ckb`. The full chart list sees `@antv/ckb`.
​

**ckbConfig.include**`optional`   
`string[]`  
ID of charts to include in the default CKB from `@antv/ckb`. The full chart list sees `@antv/ckb`.


**ckbConfig.custom** `optional`  
`object`  
Charts customized by users, not affected by `exclude` and `include`. For example:

```typescript
import { ChartKnowledgeJSON } from '@antv/ckb';

const myChart: ChartKnowledgeJSON = {
    id: 'fufu_chart',
    name: 'fufuChart',
    alias: ['futuChart'],
    family: ['fufuCharts'],
    def: 'This chart is defined by fufu',
    purpose: ['Comparison', 'Composition', 'Proportion'],
    coord: ['Polar'],
    category: ['Statistic'],
    shape: ['Round'],
    dataPres: [
      { minQty: 1, maxQty: 1, fieldConditions: ['Nominal', 'Ordinal'] },
      { minQty: 1, maxQty: 1, fieldConditions: ['Interval'] },
    ],
    channel: ['Angle', 'Area', 'Color'],
    recRate: 'Use with Caution',
  };

const advisor = new Advisor({ ckbConfig: { custom: { newChart: myChart } } });
```

The process of `ckbConfig` is 

1. if `exclude` is specified, the charts mentioned will be removed from the knowledge base.
1. if `include` is specified, the charts **not** mentioned will be removed from the knowledge base.
1. if `custom` is specified, the customized charts will be appended in the knowledge base.



**ruleConfig** `optional`  
the configuration of the rule base used for the recommendation.
​

**ruleConfig.exclude** `optional`  
IDs of rules to exclude from the rule base.
​

**ruleConfig.include** `optional`  
`string[]`  
IDs of rules to include from the rule base.
​

**ruleConfig.custom**
`object`  
Rule customized by users, not affected by `exclude` and `include`. For example:

```javascript
const myRule = {
  id: 'fufu-rule',
  type: 'HARD',
  docs: {
    lintText: 'listen to fufu',
  },
  trigger: (args) => {
    const { chartType } = args;
    return ['pie_chart'].indexOf(chartType) !== -1;
  },
  validator: (args) => {
    let result = 1;
    const { dataProps } = args;
    if (dataProps.length > 1) {
      result = 0;
    }
    return result;
  },
};

const advisor = new Advisor({ ruleConfig: { custom: { newRule: myRule } } });
```

**ruleConfig.option** `optional`  
`object`  
Options for rules, such as `weight` and `off`.

* weight: customized weight for the rule
* off: whether to ignore the rule

For example: 

```javascript
const myRuleCfg: RuleConfig = {
  options: {
    'data-check': {
      off: true,
      weight: 100,
    },
  },
};
const myAdvisor = new Advisor({ruleCfg: myRuleCfg});
```


### Advising Charts from Data


```typescript
advisor.advise({data, dataProps?, fields?, options?});
```


The above code advises a list of charts according to the input parameters.


**data**  
`object[]`  
the data used for chart recommendation, as object array, such as `[{a: 1, b: 2}, {a: 3, b: 4}]`.


**dataProps** `optional`  
`object[]`  
Defaultly, the statistical data properties will be calculated automatically in `Advisor` based on `@antv/data-wizard`. However, users can input customized data properties to meet their needs in chart knowledge base customization as well as rules'.


The customized data properties should be with type `BasicDataPropertyForAdvice`:

```typescript
interface BasicDataPropertyForAdvice {
  readonly name: string;
  readonly levelOfMeasurements: LOM[];
  readonly samples: any[];
  readonly recommendation: FieldInfo['recommendation'];
  readonly type: FieldInfo['type'];
  readonly distinct?: number;
  readonly count?: number;
  readonly sum?: number;
  readonly maximum?: any;
  readonly minimum?: any;
  readonly missing?: number;
  [key: string]: any;
}
```


We encourage users to expand the data properties based on what are calculated by `@antv/data-wizard` instead of building them from scratch.


For example, you can add a property called `threshold` by:


```typescript
import { DataFrame } from '@antv/data-wizard';

const df = new DataFrame(data);
const dp = df.info();

const newDp = dp.map(p => {
  return {
    ...p,
    threshold: 100
  }
});
```


**fields** `optional`  
`string[]`  
The data fields to use in the recommendation, that is, if there are four columns(fields) in the data, users can specify the fields to actually use for chart advising.
​

**options** `optional`  
`object`​


**options.purpose**  `optional`  
Specify an analysis purpose for getting a better recommendation.

- Comparison
- Trend
- Distribution
- Rank
- Proportion
- Composition

​

**options.preferences** `optional`  
preference settings for landscape or portrait
​

**options.refine** `optional`  
whether to apply design rules
​

**options.theme** `optional`  ​
theme of the chart styles.
​

​

## Linter 

Linter in `@antv/chart-advisor` is able to detect flaws in the chart of `antv-spec` syntax.

### Initialization

```javascript
import { Linter } from '@antv/chart-advisor';

const linter = new Linter(ruleConfig?: myRuleConfig);
```

The above code returns a Linter instance with specified configuration.
​

**ruleConfig** `optional`  
see **ruleConfig** in `Advisor`.
​

### Linting Issues in Chart

```javascript
linter.lint({ spec, options? });
```

**spec**
chart spec of `antv-spec` syntax
​

**options** `optional`  
`object`

**options.purpose**  
see **purpose** in `Advisor`'s `options`

**options.preferences**    ​  
see **preferences** in `Advisor`'s `options`
​

## ChartAdvisor

ChartAdvisor of `@antv/chart-advisor` possesses the abilities of `Advisor` and `Linter`, returning chart recommendation and their corresponding issues need for attention.
​

### Initialization

```javascript
import { ChartAdvisor } from '@antv/chart-advisor';

const ca = new ChartAdvisor({ckbConfig?: {...}, ruleConfig?: { ... }});
```

**ckbConfig** `optional`  
see **ckbConfig** in `Advisor`
​

**ruleConfig** `optional`  
see **ruleConfig** in `Advisor` 
​

### Advising Charts with Linter

```javascript
ca.advise({data, dataProps?, fields?, options?});
```

see `Advisor.advise()` for detailed information.
​

