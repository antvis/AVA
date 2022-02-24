import { Datum } from '../interface';
import { attributeSingleMeasure2MultiDimension } from './util';

import type { CompareInterval, AttributionResult, DimWithValue } from './util';

/** DataConfig specifies the input data with its focused dimensions and target measure to be analysed. */
type DataConfig = {
  sourceData: Datum[];
  dimensions: string[];
  measure: string;
};

/** FluctInfo is the necessary input for fluctuation analysis.  */
type FluctInfo = {
  /** Typically, flucDim is a time dimension that the measure value varies on */
  fluctDim: string;
  /** baseInterval is the time interval that is assigned as the basement */
  baseInterval: CompareInterval;
  /** currInterval is the time interval that user is focusing on */
  currInterval: CompareInterval;
};

export class SingleMeasureMultiDimensionAttribution {
  private result: AttributionResult;

  private dimensions: string[];

  private dimsRank = {};

  constructor(dataConfig: DataConfig, fluctInfo: FluctInfo) {
    const { sourceData, dimensions, measure } = dataConfig;
    const { fluctDim, baseInterval, currInterval } = fluctInfo;
    this.dimensions = dimensions;
    this.result = attributeSingleMeasure2MultiDimension(
      sourceData,
      dimensions,
      measure,
      fluctDim,
      baseInterval,
      currInterval
    );
    dimensions.forEach((item, index) => {
      this.dimsRank[item] = index;
    });
  }

  getWholeData() {
    return this.result;
  }

  getByDimension(specificDimensions: string[]) {
    const dimsBoolean: boolean[] = [];
    this.dimensions.forEach(() => {
      dimsBoolean.push(false);
    });
    specificDimensions.forEach((item) => {
      dimsBoolean[this.dimsRank[item]] = true;
    });
    const specificDims = [];
    dimsBoolean.forEach((item, index) => {
      if (item) {
        specificDims.push(this.dimensions[index]);
      }
    });
    const dimsKey = specificDims.join('-');
    return this.result[dimsKey];
  }

  getBySpecificValue(specificDimensionValues: DimWithValue) {
    const dimsBoolean: boolean[] = [];
    this.dimensions.forEach(() => {
      dimsBoolean.push(false);
    });
    Object.keys(specificDimensionValues).forEach((dim) => {
      dimsBoolean[this.dimsRank[dim]] = true;
    });
    const specificDims = [];
    const specificVals = [];
    dimsBoolean.forEach((item, index) => {
      if (item) {
        specificDims.push(this.dimensions[index]);
        specificVals.push(specificDimensionValues[this.dimensions[index]]);
      }
    });
    const dimKey = specificDims.join('-');
    const valKey = specificVals.join('-');
    return this.result.resultTree[dimKey].disassyDetails[valKey];
  }

  getTreeData() {
    return this.result.resultTree;
  }

  getFlattenData() {
    return this.result.resultFlatten;
  }
}
