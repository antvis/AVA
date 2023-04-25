import { cloneDeep as _cloneDeep } from 'lodash';
import moment from 'moment';

import type { Datum } from '../../../types';
import type { TreeDim, FlattenResult, DataLocation, TreeDrillDown } from './types';

/** Const for string[] join */
const joinSign = '-';

/** A helper function that can figure out a time point whether belongs to a time interval */
export const locatedInInterval = (
  comparedPoint: string | number,
  startPoint: string | number,
  endPoint: string | number
) => {
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

export const enumerateAllDimensionCombinationsByDFS = (
  item: Datum,
  index: number,
  dimensions: string[],
  resultTree: TreeDim,
  dictFlatten: Record<string, FlattenResult>,
  deque: string[],
  measure: string,
  fluctuationDim: string,
  location: DataLocation
) => {
  const resultTreePointer = resultTree;
  const DictFlattenPointer = dictFlatten;
  if (index === dimensions.length) {
    if (deque.length === 0) {
      return;
    }
    let currRoot = resultTreePointer;
    let currDimName;
    let currDimVal;
    const dequeClone = _cloneDeep(deque);
    while (dequeClone.length > 0) {
      currDimName = dequeClone.shift();
      currDimVal = item[currDimName];
      if (!Object.prototype.hasOwnProperty.call(currRoot, currDimName)) {
        currRoot[currDimName] = {};
      }
      if (!Object.prototype.hasOwnProperty.call(currRoot[currDimName], currDimVal)) {
        const treeDrillDown: TreeDrillDown = {
          info: {
            baseValue: 0,
            currValue: 0,
            diff: 0,
          },
          drillDown: {},
        };
        currRoot[currDimName][currDimVal] = treeDrillDown;
      }
      if (dequeClone.length > 0) {
        currRoot = currRoot[currDimName][currDimVal].drillDown;
      }
    }
    const currTreeDimVal = currRoot[currDimName][currDimVal];

    currTreeDimVal.info.baseValue += location === 'left' ? (item[measure] as number) : 0;
    currTreeDimVal.info.currValue += location === 'right' ? (item[measure] as number) : 0;
    if (!(currTreeDimVal.info.baseValue === 0 && currTreeDimVal.info.currValue === 0)) {
      currTreeDimVal.info.diff = currTreeDimVal.info.currValue - currTreeDimVal.info.baseValue;
    }

    if (deque.length === dimensions.length) {
      const tempKey = deque.join(joinSign);
      if (!Object.prototype.hasOwnProperty.call(DictFlattenPointer, tempKey)) {
        DictFlattenPointer[tempKey] = {};
      }
      deque.forEach((dimName) => {
        DictFlattenPointer[tempKey][dimName] = item[dimName] as string;
      });
      DictFlattenPointer[tempKey].baseValue = currTreeDimVal.info.baseValue;
      DictFlattenPointer[tempKey].currValue = currTreeDimVal.info.currValue;
      DictFlattenPointer[tempKey].diff = currTreeDimVal.info.diff;
    }

    return;
  }

  /** Case1: dimensions[index] is included */
  deque.push(dimensions[index]);
  enumerateAllDimensionCombinationsByDFS(
    item,
    index + 1,
    dimensions,
    resultTreePointer,
    DictFlattenPointer,
    deque,
    measure,
    fluctuationDim,
    location
  );
  deque.pop();

  /** Case2: dimensions[index] is not included */
  enumerateAllDimensionCombinationsByDFS(
    item,
    index + 1,
    dimensions,
    resultTreePointer,
    DictFlattenPointer,
    deque,
    measure,
    fluctuationDim,
    location
  );
};
