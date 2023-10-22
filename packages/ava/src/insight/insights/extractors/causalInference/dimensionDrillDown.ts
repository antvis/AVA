import { locatedInInterval, enumerateAllDimensionCombinationsByDFS } from './util';

import type { InfoType, DimensionDrillDownResult, TreeDim, DataLocation, DrillDownProps } from './types';

/** Main function for dimension drill down attribution */
export const dimensionDrillDownAttribution = ({
  sourceData,
  dimensions,
  targetMeasure: measure,
  timeSeriesDim: fluctuationDim,
  baseInterval,
  currInterval,
}: DrillDownProps): DimensionDrillDownResult => {
  /** remove invalid data */
  const data = sourceData.filter((item) => !Object.values(item).some((v) => v === null || v === undefined));

  const globalDiff: InfoType = {
    baseValue: 0,
    currValue: 0,
    diff: 0,
  };

  const resultTree: TreeDim = {};
  const DictFlatten = {};
  /** traverse the input data and build the result data structure; */
  data.forEach((item) => {
    let location: DataLocation = 'none';
    if (locatedInInterval(item[fluctuationDim], baseInterval.startPoint, baseInterval.endPoint)) {
      location = 'left';
      globalDiff.baseValue += item[measure] as number;
    }
    if (locatedInInterval(item[fluctuationDim], currInterval.startPoint, currInterval.endPoint)) {
      location = 'right';
      globalDiff.currValue += item[measure] as number;
    }
    if (location !== 'none') {
      const deque: string[] = [];
      enumerateAllDimensionCombinationsByDFS(
        item,
        0,
        dimensions,
        resultTree,
        DictFlatten,
        deque,
        measure,
        fluctuationDim,
        location
      );
    }
  });
  globalDiff.diff = globalDiff.currValue - globalDiff.baseValue;

  return { resultInTree: resultTree, globalDiff, resultInList: Object.values(DictFlatten) };
};
