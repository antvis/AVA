import { typeAll, isInterval } from '@antv/dw-analyzer';
import { RowData } from './util/helper';
import { AggregationType, AGGREGATION } from './parse';
import { aggregate } from './aggregate';

/**
 * @public
 */
export type ColumnInfo = {
  name: string;
  data: any[];
  domain: any[];
};

/**
 * @public
 */
export type Subspace = {
  define: Record<string, string>;
  dataset: RowData[];
};

/**
 * @public
 */
export type SiblingGroup = {
  datasetInfo: {
    dimensionTitles: string[];
    measureTitles: string[];
  };
  define: {
    subspace: Subspace;
    dimension: string;
  };
  subspaceList: Subspace[];
  dataset: RowData[];
};

/**
 * @public
 */
export type Measure = number[];

/**
 * @public
 */
export type Extractor = (siblingGroup: SiblingGroup) => Measure[];

/**
 * @public
 */
export const rankExtractor: Extractor = (siblingGroup) => {
  const measures = siblingGroup.datasetInfo.measureTitles;
  const data = siblingGroup.dataset;

  const results: Measure[] = [];

  measures.forEach((measure) => {
    const measureName = measure;
    const measureColumn = data.map((row) => row[measureName]);
    const sorted = measureColumn.slice().sort((a, b) => b - a);
    const ranks = measureColumn.map((v) => sorted.indexOf(v) + 1);
    results.push(ranks);
  });

  return results;
};

/**
 * @public
 */
export const percentExtractor: Extractor = (siblingGroup) => {
  const measures = siblingGroup.datasetInfo.measureTitles;
  const data = siblingGroup.dataset;

  const results: Measure[] = [];

  measures.forEach((measure) => {
    const measureName = measure;
    const measureColumn = data.map((row) => row[measureName]);

    const sum = measureColumn.reduce((a, b) => a + b, 0);
    const percents = measureColumn.map((v) => v / sum);

    results.push(percents);
  });

  return results;
};

const tuple = <T extends string[]>(...args: T) => args;

/**
 * @public
 */
export const EXTRACTORS = tuple('rank', 'percent');

/**
 * @public
 */
export type ExtractorType = typeof EXTRACTORS[number];

/**
 * @public
 */
export const extractors: Record<ExtractorType, Extractor> = {
  rank: rankExtractor,
  percent: percentExtractor,
};

/**
 * @public
 */
export type AggExtractorPair = {
  agg: AggregationType;
  measure: string;
};

/**
 * @public
 */
export type SubExtractorPair = {
  extractor: ExtractorType;
  dimension: string;
};

/**
 * @public
 */
export type AllSubspaceDatasetOptions = {
  dimensions?: string[];
  measures?: string[];
  aggregations?: AggregationType[];
  extractors?: ExtractorType[];
  depth?: number;
};

/**
 * @public
 */
export class Dataset {
  private _dataset: RowData[];
  private _dimensions: ColumnInfo[];
  private _measures: ColumnInfo[];
  private _dimensionTitles: string[];
  private _measureTitles: string[];

  constructor(dataset: RowData[]) {
    this._dataset = dataset;

    this._dimensions = [];
    this._measures = [];
    this._dimensionTitles = [];
    this._measureTitles = [];

    this._calculateDimensionsAndMeasures();
  }

  get dataset(): RowData[] {
    return this._dataset;
  }

  set dataset(dataset: RowData[]) {
    this._dataset = dataset;
  }

  get dimensions(): ColumnInfo[] {
    return this._dimensions;
  }

  get measures(): ColumnInfo[] {
    return this._measures;
  }

  get dimensionTitles(): string[] {
    return this._dimensionTitles;
  }

  get measureTitles(): string[] {
    return this._measureTitles;
  }

  private _calculateDimensionsAndMeasures() {
    const fieldInfos = typeAll(this.dataset);
    fieldInfos.forEach((fieldInfo) => {
      const fieldColumnInfo: ColumnInfo = {
        name: fieldInfo.name,
        data: fieldInfo.samples,
        domain: [...new Set(fieldInfo.samples)],
      };
      if (isInterval(fieldInfo)) {
        this._measures.push(fieldColumnInfo);
        this._measureTitles.push(fieldInfo.name);
      } else {
        this._dimensions.push(fieldColumnInfo);
        this._dimensionTitles.push(fieldInfo.name);
      }
    });
  }

  subspace(defineArray: string[] = this._dimensions.map((_) => '*')): Subspace {
    if (defineArray.length !== this._dimensions.length) {
      throw new Error('Subspace define array must contain all dimensions.');
    }
    for (let i = 0; i < defineArray.length; i++) {
      if (defineArray[i] !== '*' && !this._dimensions[i].domain.includes(defineArray[i])) {
        console.error(defineArray[i]);
        console.log(this._dimensions[i].domain);
        throw new Error(
          'Subspace define array must mapping to dimension array with * or elements in dimension domain.'
        );
      }
    }

    const subdataset: RowData[] = [];
    this._dataset.forEach((row) => {
      let isValidRow = true;
      defineArray.forEach((defD, index) => {
        const titleD = this._dimensionTitles[index];
        if (defD !== '*' && row[titleD] !== defD) {
          isValidRow = false;
        }
      });
      if (isValidRow) {
        subdataset.push(row);
      }
    });

    const defineObj: Record<string, string> = {};
    this._dimensionTitles.forEach((d, i) => {
      defineObj[d] = defineArray[i];
    });

    return {
      define: defineObj,
      dataset: subdataset,
    };
  }

  siblingGroup(subspace: Subspace, dimension: string): SiblingGroup {
    if (!this._dimensionTitles.includes(dimension)) {
      console.log(JSON.stringify(subspace));
      throw new Error(`No such dimension: ${dimension}.`);
    }

    const defineSubspace = subspace;
    const defineDimension = dimension;

    let domainD: any[] = [];
    let indexD = -1;
    this._dimensions.forEach((d, i) => {
      if (d.name === defineDimension) {
        domainD = d.domain;
        indexD = i;
      }
    });

    const subspaceList: Subspace[] = [];
    domainD.forEach((e) => {
      const newSubspaceDefineArray = this._dimensionTitles.map((d) => defineSubspace.define[d]);
      newSubspaceDefineArray[indexD] = e;
      const newSupspace = this.subspace(newSubspaceDefineArray);
      subspaceList.push(newSupspace);
    });

    let siblingGroupDataset: RowData[] = [];
    siblingGroupDataset = siblingGroupDataset.concat(...subspaceList.map((subspace) => subspace.dataset));

    return {
      datasetInfo: {
        dimensionTitles: this._dimensionTitles,
        measureTitles: this._measureTitles,
      },
      define: {
        subspace: defineSubspace,
        dimension: defineDimension,
      },
      subspaceList,
      dataset: siblingGroupDataset,
    };
  }

  allSubspaceDataset(options?: AllSubspaceDatasetOptions): RowData[][] {
    const MAX_DEPTH = 3;

    const dimensions: string[] = (options && options.dimensions) || this._dimensionTitles;
    const measures: string[] = (options && options.measures) || this._measureTitles;
    const aggregations: AggregationType[] = (options && options.aggregations) || AGGREGATION;
    const extractors: ExtractorType[] = (options && options.extractors) || EXTRACTORS;
    const depth: number = options && options.depth && options.depth < MAX_DEPTH ? options.depth : MAX_DEPTH;

    // traverse siblingGroups - by combinations of (subspaces & dimensions)

    const defineArray = dimensions.map((_) => '*');

    const allSiblingGroups = dimensions.map((d) => this.siblingGroup(this.subspace(defineArray), d));

    // traverse subspaceDatasets - by combinations of (siblingGroups & aggs & measures & extractors & depth)

    let allSubspaceDatasets: RowData[][] = [];

    allSiblingGroups.forEach((sg) => {
      measures.forEach((measure) => {
        aggregations.forEach((agg) => {
          const possibleExtractorPairs: SubExtractorPair[] = [];
          extractors.forEach((extractor) => {
            dimensions.forEach((dimension) => {
              possibleExtractorPairs.push({ extractor, dimension });
            });
          });

          let extractorPairs: SubExtractorPair[] = [];
          for (let x = 0; x < possibleExtractorPairs.length; x++) {
            for (let y = 0; y < possibleExtractorPairs.length; y++) {
              extractorPairs = [possibleExtractorPairs[x], possibleExtractorPairs[y]];
            }
          }

          // remove duplicates
          const resultsDiffDepth: RowData[][] = [];
          for (let i = 0; i < depth; i++) {
            const subDataset: RowData[] = compositeExtractor(sg, { agg, measure }, extractorPairs, i);

            let hasDuplication = false;
            for (let j = 0; j < resultsDiffDepth.length; j++) {
              if (
                Object.keys(resultsDiffDepth[j][0])
                  .sort()
                  .join(',') ===
                Object.keys(subDataset[0])
                  .sort()
                  .join(',')
              ) {
                hasDuplication = true;
                break;
              }
            }
            if (!hasDuplication) {
              resultsDiffDepth.push(subDataset);
            }
          }

          allSubspaceDatasets = allSubspaceDatasets.concat(resultsDiffDepth);
        });
      });
    });

    return allSubspaceDatasets;
  }
}

/**
 * @public
 */
export function compositeExtractor(
  siblingGroup: SiblingGroup,
  aggPair: AggExtractorPair,
  extractorPairs: SubExtractorPair[] = [],
  depth: number = extractorPairs.length + 1
): RowData[] {
  let result = [];

  const { define, datasetInfo } = siblingGroup;
  const { dimension: defineDimension, subspace: defineSubspace } = define;
  const { dimensionTitles } = datasetInfo;

  // first extractor is aggregation

  const { agg, measure } = aggPair;

  const aggedDataset = siblingGroup.dataset.map((row) => {
    const newRow: RowData = [];
    dimensionTitles.forEach((d) => {
      if (defineSubspace.define[d] !== '*' || d === defineDimension) {
        newRow[d] = row[d];
      }
    });
    newRow[measure] = row[measure];
    return newRow;
  });

  const data1 = aggregate(aggedDataset, {
    groupBy: defineDimension,
    fields: [measure],
    as: [measure],
    op: [agg],
  });
  // rename
  result = data1.map((row) => {
    const newRow: RowData = {};
    Object.keys(row)
      .filter((k) => k !== measure)
      .forEach((k) => {
        newRow[k] = row[k];
      });
    newRow[`${measure}_${agg}`] = row[measure];
    return newRow;
  });

  // then, t-1 round of extracting

  let t = depth < 1 ? 1 : depth;
  t = t > 1 + extractorPairs.length ? 1 + extractorPairs.length : t;

  for (let i = 0; i < t - 1; i++) {
    // each round of extracting
    const tempDataset = new Dataset(result);
    const { extractor: extractorType, dimension: extractByDimension } = extractorPairs[i];

    if (tempDataset.dimensionTitles.includes(extractByDimension)) {
      const extractor = extractors[extractorType];
      const rColumn = extractor(tempDataset.siblingGroup(tempDataset.subspace(), extractByDimension))[0];

      const extractedResult: RowData[] = [];
      const newMeasureName = `${tempDataset.measureTitles[0]}_${extractorType}`;
      result.forEach((row, index) => {
        const newRow: RowData = {};
        tempDataset.dimensionTitles.forEach((d) => {
          newRow[d] = row[d];
        });
        newRow[newMeasureName] = rColumn[index];
        extractedResult.push(newRow);
      });

      result = extractedResult;
    }
  }

  return result;
}
