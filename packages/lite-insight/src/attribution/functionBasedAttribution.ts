import { Parser } from 'expr-eval';
import { locatedInInterval } from './util';
import type { Datum } from '../interface';
import type { DataConfig, CompareInterval, InfoType, FluctInfo, AttributionResult } from './types';

// Main function for function based attribution
const attribute2MultiMeasures: (
  sourceData: Datum[],
  measures: string[],
  expression: string,
  fluctuationDim: string,
  baseInterval: CompareInterval,
  currInterval: CompareInterval
) => AttributionResult = (sourceData, measures, expression, fluctuationDim, baseInterval, currInterval) => {
  // remove invalid data
  const data = sourceData.filter((item) => !Object.values(item).some((v) => v === null || v === undefined));

  const result: Record<string, InfoType> = {};
  measures.forEach((item) => {
    const measureInfo: InfoType = {
      baseValue: 0,
      currValue: 0,
      diff: 0,
    };
    result[item] = measureInfo;
  });

  data.forEach((item) => {
    if (locatedInInterval(item[fluctuationDim], baseInterval.startPoint, baseInterval.endPoint)) {
      measures.forEach((measure) => {
        result[measure].baseValue += item[measure] as number;
        result[measure].diff = result[measure].currValue - result[measure].baseValue;
      });
    }
    if (locatedInInterval(item[fluctuationDim], currInterval.startPoint, currInterval.endPoint)) {
      measures.forEach((measure) => {
        result[measure].currValue += item[measure] as number;
        result[measure].diff = result[measure].currValue - result[measure].baseValue;
      });
    }
  });

  // helper data structure to calculate the result of the input expression
  const currMeasuresMap: Record<string, number> = {};
  const baseMeasuresMap: Record<string, number> = {};
  measures.forEach((measure) => {
    currMeasuresMap[measure] = result[measure].currValue;
    baseMeasuresMap[measure] = result[measure].baseValue;
  });

  // A data structure to record the aggregated value of all valid data
  const unitedInfo: InfoType = {
    baseValue: 0,
    currValue: 0,
    diff: 0,
  };
  const expr = new Parser().parse(expression);
  unitedInfo.currValue = expr.evaluate(currMeasuresMap);
  unitedInfo.baseValue = expr.evaluate(baseMeasuresMap);
  unitedInfo.diff = unitedInfo.currValue - unitedInfo.baseValue;

  return { unitedInfo, result };
};

export class FunctionBasedAttribution {
  private result: AttributionResult;

  constructor(dataConfig: DataConfig, fluctInfo: FluctInfo) {
    const { sourceData, measures, expression } = dataConfig;
    const { fluctDim, baseInterval, currInterval } = fluctInfo;

    this.result = attribute2MultiMeasures(sourceData, measures, expression, fluctDim, baseInterval, currInterval);
  }

  getResult() {
    return this.result;
  }
}
