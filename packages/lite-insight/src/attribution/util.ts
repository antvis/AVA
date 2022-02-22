import moment from 'moment';
import { Datum } from '../interface';

export type CompareInterval = {
  /** start time of this interval */
  startPoint: string | number;
  /** end time of this interval */
  endPoint: string | number;
};

/**  dimension level disassembly information */
type disassyInfoDimLevel = {
  /** total difference of this dimension */
  totalDiff: number;
  /** disassembly details of concrete dimension value combinations */
  disassyDetails: Record<string, disassyInfoDimValLevel>;
};

/** dimension value level disassemble information */
type disassyInfoDimValLevel = {
  baseValue: number;
  currValue: number;
  diff: number;
  contribution: number;
};

/** a flag that indicates the belongings of a single line of data, which is useful for aggregation */
type dataLocation = 'left' | 'right' | 'none';

export const keyJoinMethod = '-';

export const transferInnerData2Tree = (originMap, dimensions: string[]) => {
  // placeHolder
  let resultTree = dimensions;
  resultTree = originMap;
  // this function has not been implemented.
  return resultTree;
};

const locatedInInterval = (comparedPoint: string | number, startPoint: string | number, endPoint: string | number) => {
  if (typeof comparedPoint === 'number' && typeof startPoint === 'number' && typeof endPoint === 'number') {
    return comparedPoint <= endPoint && comparedPoint >= startPoint;
  }
  if (typeof comparedPoint === 'string' && typeof startPoint === 'string' && typeof endPoint === 'string') {
    const compareMoment = moment(comparedPoint);
    const startMoment = moment(startPoint);
    const endMoment = moment(endPoint);
    if (!compareMoment.isValid() || !startMoment.isValid() || !endMoment.isValid()) {
      /* eslint-disable */
      console.error('Invalid time input.');
      /* eslint-enable */
      return false;
    }
    /** rule: left <= target < right */
    return compareMoment.isBefore(endMoment) && compareMoment.isSameOrAfter(startMoment);
  }
  return false;
};

const enumerateAllDimensionCombinationsByDFS = (
  item: Datum,
  index: number,
  dimensions: string[],
  result: Object,
  stack: string[],
  measure: string,
  fluctuationDim: string,
  location: dataLocation
) => {
  const resultPointer = result;
  if (index === dimensions.length) {
    /** termination condition of the recursion algorithm */
    const dimName = stack.join(keyJoinMethod);
    if (!Object.prototype.hasOwnProperty.call(resultPointer, dimName)) {
      const dimInfo: disassyInfoDimLevel = {
        totalDiff: 0,
        disassyDetails: {},
      };
      resultPointer[dimName] = dimInfo;
    }

    const dimValues: string[] = new Array(stack.length);
    for (let i = 0; i < stack.length; i += 1) {
      dimValues[i] = item[stack[i]] as string;
    }
    const dimValName = dimValues.join(keyJoinMethod);
    if (!Object.prototype.hasOwnProperty.call(resultPointer[dimName].disassyDetails, dimValName)) {
      const dimInfoSub: disassyInfoDimValLevel = {
        baseValue: 0,
        currValue: 0,
        diff: 0,
        contribution: 0,
      };
      resultPointer[dimName].disassyDetails[dimValName] = dimInfoSub;
    }

    const tempDimInfoSub: disassyInfoDimValLevel = resultPointer[dimName].disassyDetails[dimValName];
    resultPointer[dimName].total -= tempDimInfoSub.diff;
    tempDimInfoSub.baseValue += location === 'left' ? (item[measure] as number) : 0;
    tempDimInfoSub.currValue += location === 'right' ? (item[measure] as number) : 0;
    if (!(tempDimInfoSub.baseValue === 0 && tempDimInfoSub.currValue === 0)) {
      tempDimInfoSub.diff = tempDimInfoSub.currValue - tempDimInfoSub.baseValue;
    }
    resultPointer[dimName].total += tempDimInfoSub.diff;
    return;
  }

  /** Case1: dimensions[index] is included */
  stack.push(dimensions[index]);
  enumerateAllDimensionCombinationsByDFS(
    item,
    index + 1,
    dimensions,
    resultPointer,
    stack,
    measure,
    fluctuationDim,
    location
  );
  stack.pop();

  /** Case2: dimensions[index] is not included */
  enumerateAllDimensionCombinationsByDFS(
    item,
    index + 1,
    dimensions,
    resultPointer,
    stack,
    measure,
    fluctuationDim,
    location
  );
};

export const attributeSingleMeasure2MultiDimension = (
  sourceData: Datum[],
  dimensions: string[],
  measure: string,
  fluctuationDim: string,
  baseInterval: CompareInterval,
  currInterval: CompareInterval
) => {
  /** remove invalid data */
  const data = sourceData.filter((item) => !Object.values(item).some((v) => v === null || v === undefined));

  const result = {};
  /** traverse the input data and build the result data structure; */
  data.forEach((item) => {
    let location: dataLocation = 'none';
    if (locatedInInterval(item[fluctuationDim], baseInterval.startPoint, baseInterval.endPoint)) {
      location = 'left';
    }
    if (locatedInInterval(item[fluctuationDim], currInterval.startPoint, currInterval.endPoint)) {
      location = 'right';
    }
    if (location !== 'none') {
      const stack: string[] = [];
      enumerateAllDimensionCombinationsByDFS(item, 0, dimensions, result, stack, measure, fluctuationDim, location);
    }
  });

  /** calculate the contribution of every dimension value combination to the designated measure */
  Object.values(result).forEach((value: disassyInfoDimLevel) => {
    Object.values(value.disassyDetails).forEach((valueSub) => {
      const valueSubPointer = valueSub;
      valueSubPointer.contribution = valueSub.diff / value.totalDiff;
    });
  });

  return result;
};
