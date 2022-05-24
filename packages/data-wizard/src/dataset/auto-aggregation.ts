/* eslint-disable no-plusplus */
import Graph from 'graphology';

import { mean, meanBy, sum, sumBy, min, minBy, max, maxBy, median, groupBy } from '../statistics';

import { DataFrame } from '.';

export default class AutoAggregation {
  dataFrame: DataFrame;

  dataInfo = [];

  nominalColumns: number[];

  timeColumns: number[];

  ordinalColumns: number[];

  intervalColumns: number[];

  unknownColumns: number[];

  nonIntervalColumns: number[];

  distinctColumnMap: Record<number, string[] | number[]>;

  longestHierarchicalList: number[];

  graph: Graph;

  constructor(dataFrame: DataFrame) {
    this.dataFrame = dataFrame;
    this.dataInfo = dataFrame.info();
    this.dataPrep(this.dataInfo);

    if (this.intervalColumns.length === 0) {
      console.error('Interval column is demanded.');
      return;
    }
    if (this.intervalColumns.length > 1) {
      console.error('This Dataset may should be stacked.');
    }
    if (this.nonIntervalColumns.length === 0) {
      console.error('There are not valid dimensions for aggregation.');
      return;
    }

    this.distinctColumnMap = this.getDistinctColumnMap(this.nonIntervalColumns);
    this.longestHierarchicalList = this.findHierarchy(this.nonIntervalColumns, this.distinctColumnMap);
  }

  getDefaultAggregatedResult(aggMethod?: string) {
    let defaultDimensionColumn = -1;
    let defaultMeasureColumn = -1;
    const numOfDistinctColumns = Object.keys(this.distinctColumnMap).length;
    const result = { datum: [], generalDimensions: [], hierarchicalDimensions: [] };
    let aggRes = { dimension: [], measure: [] };

    if (numOfDistinctColumns === 0) {
      defaultDimensionColumn = this.nonIntervalColumns[0];
    } else if (this.longestHierarchicalList.length === 0) {
      defaultDimensionColumn = Number(Object.keys(this.distinctColumnMap)[0]);
    } else {
      defaultDimensionColumn = this.longestHierarchicalList[0];
    }

    defaultMeasureColumn = this.intervalColumns[0];
    aggRes = this.aggregateMeasureByOneDimension(
      defaultDimensionColumn,
      defaultMeasureColumn,
      !Object.prototype.hasOwnProperty.call(this.distinctColumnMap, defaultDimensionColumn)
    );
    const defaultDimensionName = this.dataInfo[defaultDimensionColumn].name;
    const defaultMeasureName = this.dataInfo[defaultMeasureColumn].name;
    result.datum = aggRes.dimension.map((value, index) => {
      return {
        [defaultDimensionName]: value,
        [defaultMeasureName]: this.aggregateArray(aggRes.measure[index], aggMethod),
      };
    });
    result.generalDimensions = this.nonIntervalColumns
      .filter((columnNum) => !Object.prototype.hasOwnProperty.call(this.distinctColumnMap, columnNum))
      .map((i) => this.dataInfo[i].name);
    result.hierarchicalDimensions = this.longestHierarchicalList.map((i) => this.dataInfo[i].name);
    return result;
  }

  aggregateMeasureByOneDimension(dimensionColumn: number, measureColumn: number, isGeneralDimension: boolean) {
    const result = { dimension: [], measure: [] };
    const dimensionName = this.dataInfo[dimensionColumn].name;
    const measureName = this.dataInfo[measureColumn].name;
    const inputDimension = this.dataFrame.getByColumn(dimensionName).data;
    const inputMeasure = this.dataFrame.getByColumn(measureName).data;
    if (isGeneralDimension) {
      result.dimension = inputDimension;
      result.measure = inputMeasure;
    } else {
      const aggGraph = new Graph({ type: 'directed', allowSelfLoops: false });
      for (let i = 0; i < inputDimension.length; i += 1) {
        const dimensionNode = inputDimension[i];
        const measureNode = `${inputMeasure[i]}_${i}`;
        aggGraph.mergeNode(dimensionNode, { type: 'dimension' });
        aggGraph.addNode(measureNode, { type: 'measure', value: inputMeasure[i] });
        aggGraph.addDirectedEdge(dimensionNode, measureNode);
      }
      result.dimension = this.distinctColumnMap[dimensionColumn];
      result.measure = this.distinctColumnMap[dimensionColumn].map((dimName) => {
        return aggGraph.reduceOutNeighbors(
          dimName,
          (accumulator, neighbor) => {
            const valueOfNode = aggGraph.getNodeAttribute(neighbor, 'value');
            accumulator.push(Number(valueOfNode));
            return accumulator;
          },
          []
        );
      });
    }
    return result;
  }

  aggregateMultipleMeasuresAndDimensions(
    seq: Record<string, string | number>[],
    dimensionColumnNames: string[],
    measureColumnNames: string[],
    result: Record<string, string | number>[],
    aggMethod?: Record<string, string>
  ) {
    if (!dimensionColumnNames.length) {
      // terminal condition of recursion
      const obj = {};
      for (let i = 0; i < dimensionColumnNames.length; i++) {
        const dimId = dimensionColumnNames[i];
        obj[dimId] = seq[0][dimId];
      }

      for (let j = 0; j < measureColumnNames.length; j++) {
        const meaId = measureColumnNames[j];
        const agg = Object.prototype.hasOwnProperty.call(aggMethod, meaId);
        obj[meaId] = this.getAggregatedMeasure(agg, seq, meaId);
      }
      result.push(obj);
      return seq;
    }

    const firstKey = dimensionColumnNames[0];
    const restKey = dimensionColumnNames.slice(1);
    return groupBy(seq, firstKey).map((value) => {
      return this.aggregateMultipleMeasuresAndDimensions(value, restKey, measureColumnNames, result, aggMethod); // 采用递归的方式依次groupBy多个维度
    });
  }

  /** Format interval columns and non interval columns */
  dataPrep(dataInfo) {
    /** Discriminate columns by type: nominal, ordinal, time and interval  */
    this.nominalColumns = dataInfo
      .map((columnInfo, index) => {
        return { levelOfMeasurements: columnInfo.levelOfMeasurements, index: index };
      })
      .filter((columnInfo) => columnInfo.levelOfMeasurements.includes('Nominal'))
      .map((item) => item.index);

    let filteredColumns = []; // in case that selected columns are duplicated
    filteredColumns = filteredColumns.concat(this.nominalColumns);

    this.timeColumns = dataInfo
      .map((columnInfo, index) => {
        return { levelOfMeasurements: columnInfo.levelOfMeasurements, index: index };
      })
      .filter((columnInfo) => columnInfo.levelOfMeasurements.includes('Time'))
      .map((item) => item.index)
      .filter((v) => !filteredColumns.includes(v));
    filteredColumns = filteredColumns.concat(this.timeColumns);

    this.ordinalColumns = dataInfo
      .map((columnInfo, index) => {
        return { levelOfMeasurements: columnInfo.levelOfMeasurements, index: index };
      })
      .filter((columnInfo) => columnInfo.levelOfMeasurements.includes('Ordinal'))
      .map((item) => item.index)
      .filter((v) => !filteredColumns.includes(v));
    filteredColumns = filteredColumns.concat(this.ordinalColumns);

    this.intervalColumns = dataInfo
      .map((columnInfo, index) => {
        return { levelOfMeasurements: columnInfo.levelOfMeasurements, index: index };
      })
      .filter((columnInfo) => columnInfo.levelOfMeasurements.includes('Interval'))
      .map((item) => item.index)
      .filter((v) => !filteredColumns.includes(v));
    filteredColumns = filteredColumns.concat(this.intervalColumns);

    this.unknownColumns = dataInfo
      .map((value, index) => {
        value = value;
        return index;
      })
      .filter((value) => !filteredColumns.includes(value));

    /** For nominal colums,
     * we need to find the hidden hierarchy of these columns, if there are.
     */
    /** Rank the non-interval columns by the distinct value in them */
    this.nonIntervalColumns = this.nominalColumns.concat(this.ordinalColumns).concat(this.unknownColumns);
    const nonIntervalColumnsForSort = this.nonIntervalColumns.map((item) => [item, this.dataInfo[item].distinct]);
    nonIntervalColumnsForSort.sort(this.compareByDistinctValue);
    this.nonIntervalColumns = nonIntervalColumnsForSort.map((item) => item[0]);
    this.nonIntervalColumns = this.nonIntervalColumns.concat(this.timeColumns);
  }

  /** Create a map that contains only unique values */
  getDistinctColumnMap(nonIntervalColumns: number[]) {
    if (nonIntervalColumns.length < 2) {
      return null;
    }
    const distinctColumnMap: Record<number, string[] | number[]> = {};
    for (let i = 0; i < nonIntervalColumns.length; i += 1) {
      const columnNumber = nonIntervalColumns[i];
      const columnName = this.dataInfo[columnNumber].name;
      const column = this.dataFrame.getByColumn(columnName).data;
      const distinctColumn = [...new Set(column)];
      if (distinctColumn.length === column.length) {
        break;
      }
      distinctColumnMap[columnNumber] = distinctColumn;
    }
    return distinctColumnMap; // this data structure only contains columns that the number of unique values in that is less than the length of the column.
  }

  compareByDistinctValue(a: number[], b: number[]) {
    if (a[1] < b[1]) {
      return -1;
    }
    if (a[1] > b[1]) {
      return 1;
    }
    return 0;
  }

  /** Find hierarchical structure from tabular data */
  findHierarchy(nonIntervalColumns: number[], distinctColumnMap: Record<number, string[] | number[]>) {
    if (nonIntervalColumns.length === 0) {
      return null;
    }
    if (nonIntervalColumns.length === 1) {
      return [nonIntervalColumns[0]];
    }
    const hierarchicalTuple = {}; // number in this structure is the index of column in nonIntervalColumns
    let longestHierarchicalList = [nonIntervalColumns[0]];

    hierarchicalTuple[nonIntervalColumns.length - 1] = [];
    for (let i = nonIntervalColumns.length - 2; i >= 0; i -= 1) {
      const columnNumber = nonIntervalColumns[i];
      hierarchicalTuple[i] = [];
      if (!Object.prototype.hasOwnProperty.call(this.distinctColumnMap, columnNumber)) {
        continue; // 如果该列原本就没有重复值，说明该列不存在层次结构，直接跳过。
      }
      hierarchicalTuple[i] = this.findChildrenColumns(nonIntervalColumns, i, distinctColumnMap, hierarchicalTuple);
    }

    /** Get the longest hierarchy structure by dynamic programing */
    let longestLength = 1;
    let longestIndex = nonIntervalColumns.length - 1;
    const dpArray = nonIntervalColumns.map((item) => {
      item = item;
      return 0;
    });
    const dpMap = {};
    dpArray[nonIntervalColumns.length - 1] = 1;
    dpMap[nonIntervalColumns.length - 1] = [nonIntervalColumns.length - 1];
    for (let i = nonIntervalColumns.length - 2; i >= 0; i -= 1) {
      let tempList = [i];
      for (let j = 0; j < hierarchicalTuple[i].length; j += 1) {
        const target = hierarchicalTuple[i][j];
        if (dpMap[target].length + 1 > tempList) {
          tempList = [i].concat(dpMap[target]);
        }
      }
      dpMap[i] = tempList;
      dpArray[i] = tempList.length;
      if (dpArray[i] > longestLength) {
        longestIndex = i;
        longestLength = dpArray[i];
      }
    }
    longestHierarchicalList = dpMap[longestIndex].map((i) => nonIntervalColumns[i]); // number in this list is the real column index in origin dataset
    return longestHierarchicalList;
  }

  /** Find all the children columns and return a children array */
  findChildrenColumns(
    nonIntervalColumns: number[],
    index: number,
    distinctColumnMap: Record<number, string[] | number[]>,
    hierarchicalTuple
  ) {
    const hierarchicalList: number[] = [];
    const visitedList: boolean[] = nonIntervalColumns.map((item) => {
      item = item;
      return false;
    });
    const preColumnNumber = nonIntervalColumns[index];
    const preColumnName = this.dataInfo[preColumnNumber].name;
    const preColumn = this.dataFrame.getByColumn(preColumnName).data;
    for (let i = index + 1; i < nonIntervalColumns.length; i += 1) {
      const nxtColumnNumber = nonIntervalColumns[i];
      if (visitedList[i]) {
        continue;
      }
      const nxtColumnName = this.dataInfo[nxtColumnNumber].name;
      const nxtColumn = this.dataFrame.getByColumn(nxtColumnName).data;
      let distinctCol = [];
      if (!Object.prototype.hasOwnProperty.call(this.distinctColumnMap, nxtColumnNumber)) {
        distinctCol = this.dataFrame.getByColumn(nxtColumnName).data;
      } else {
        distinctCol = distinctColumnMap[nxtColumnNumber];
      }
      const isHierarchicalTuple = this.isHierarchical(preColumn, nxtColumn, distinctCol);
      if (isHierarchicalTuple) {
        hierarchicalList.push(i);
        for (let j = 0; j < hierarchicalTuple[i].length; j += 1) {
          visitedList[j] = true;
        }
      }
    }
    return hierarchicalList;
  }

  /** Determine if there is hierarchical relationship between two columns */
  isHierarchical(preColumn, nxtColumn, distinctNxt): boolean {
    const biGraph = new Graph({ type: 'directed', allowSelfLoops: false });
    for (let i = 0; i < preColumn.length; i += 1) {
      biGraph.mergeNode(preColumn[i]);
      biGraph.mergeNode(nxtColumn[i]);
      biGraph.mergeDirectedEdge(preColumn[i], nxtColumn[i]);
    }
    let flag = true; // true represents that the two columns are hierarchical
    for (let i = 0; i < distinctNxt.length; i += 1) {
      if (biGraph.inNeighbors(distinctNxt[i]).length !== 1) {
        flag = false;
        break;
      }
    }
    return flag;
  }

  /** Helper Function */
  aggregateArray(array: number[], aggMethod?: string) {
    switch (aggMethod) {
      case 'sum':
        return sum(array);
      case 'mean':
        return mean(array);
      case 'min':
        return min(array);
      case 'max':
        return max(array);
      case 'median':
        return median(array);
      case 'count':
        return array.length;
      default:
        return sum(array);
    }
  }

  /** Helper Function */
  getAggregatedMeasure(agg: string, value: any[], measure: string) {
    switch (agg) {
      case 'sum': {
        return sumBy(value, measure);
      }
      case 'avg': {
        return meanBy(value, measure);
      }
      case 'min': {
        return minBy(value, measure);
      }
      case 'max': {
        return maxBy(value, measure);
      }
      case 'count': {
        return value.length;
      }
      case 'count_distinct': {
        return [...new Set(value)].length;
      }
      case 'non_aggregated': {
        return value.map((item) => {
          return item[measure];
        });
      }
      default: {
        console.error(`Unvalid Aggregation method： ${agg}. Data is aggregated by default sum method.`);
        return sumBy(value, measure);
      }
    }
  }
}
