import { locatedInInterval, enumerateAllDimensionCombinationsByDFS } from './util';
import type { Datum } from '../interface';
import type {
  DataConfig,
  CompareInterval,
  InfoType,
  FluctInfo,
  AttributionResult,
  TreeDim,
  DataLocation,
} from './types';

/** Main function for dimension drill down attribution */
const attribute2MultiDimensions: (
  sourceData: Datum[],
  dimensions: string[],
  measure: string,
  fluctuationDim: string,
  baseInterval: CompareInterval,
  currInterval: CompareInterval
) => AttributionResult = (sourceData, dimensions, measure, fluctuationDim, baseInterval, currInterval) => {
  /** remove invalid data */
  const data = sourceData.filter((item) => !Object.values(item).some((v) => v === null || v === undefined));

  const unitedInfo: InfoType = {
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
      unitedInfo.baseValue += item[measure] as number;
    }
    if (locatedInInterval(item[fluctuationDim], currInterval.startPoint, currInterval.endPoint)) {
      location = 'right';
      unitedInfo.currValue += item[measure] as number;
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
  unitedInfo.diff = unitedInfo.currValue - unitedInfo.baseValue;

  return { resultTree, unitedInfo, resultFlatten: Object.values(DictFlatten) };
};

export class DimensionDrillDownAttribution {
  private result: AttributionResult;

  private dimsRank = {};

  constructor(dataConfig: DataConfig, fluctInfo: FluctInfo) {
    const { sourceData, dimensions, measures } = dataConfig;
    const { fluctDim, baseInterval, currInterval } = fluctInfo;
    this.result = attribute2MultiDimensions(sourceData, dimensions, measures[0], fluctDim, baseInterval, currInterval);
    dimensions.forEach((item, index) => {
      this.dimsRank[item] = index;
    });
  }

  getWholeData() {
    return this.result;
  }

  getTreeData() {
    return this.result.resultTree;
  }

  getFlattenData() {
    return this.result.resultFlatten;
  }
}
