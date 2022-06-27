/* eslint-disable no-underscore-dangle */
import { statistics } from '@antv/data-wizard';
import { getDataInsights } from '@antv/lite-insight';
import { Advisor } from '@antv/chart-advisor';

import { checkInsightTypes } from '../utils';
import { INSIGHT_TYPES, G2PLOT_TYPES } from '../constants';

import { SmartBoard } from './ChartToBoard';

import type { Measure } from '@antv/lite-insight';
import type { Chart, InputChart, SmartBoardType, DataToBoardProps, Datum, InsightType } from '../types';

/**
 * DataToBoard as SmartBoard (new SB)
 * Get Dashboard from input data
 * @public
 */
export class DataToBoardAdvisor {
  private _charts: Chart[];

  private _board: SmartBoard;

  private _sbType: SmartBoardType;

  constructor(props: DataToBoardProps) {
    const { inputData, measures, dimensions, insightTypeList, insightNumber } = props;
    // if there is empty data, return error message
    if (!inputData?.length) {
      throw new Error('The input dataset is empty!');
    }

    let resultCharts: InputChart[];
    resultCharts = this.getInsightCharts(inputData, measures, insightTypeList, insightNumber);

    // recommend charts by CA
    // only if cannot compute insights by LI
    if (!resultCharts.length) {
      this._sbType = 'advisor';
      resultCharts = this.getAdvisorCharts(inputData, measures, dimensions);
    } else {
      this._sbType = 'insight';
    }

    if (!resultCharts?.length) {
      throw new Error('The input dataset cannot be parsed into charts!');
    }

    this._board = new SmartBoard(resultCharts);
  }

  /**
   * Computer insights by LiteInsight
   */
  private getInsightCharts(
    inputData: Datum[],
    measures?: Measure[],
    insightTypeList?: InsightType[],
    insightNumber?: number
  ) {
    const insightResult = getDataInsights(inputData, {
      limit: insightNumber,
      measures,
      visualization: true,
      insightTypes: insightTypeList?.length && checkInsightTypes(insightTypeList) ? insightTypeList : INSIGHT_TYPES,
    })?.insights;

    const resultCharts: InputChart[] = [];
    // generate charts from insights
    insightResult?.forEach((item, index) => {
      const { data: itemData, visualizationSchemas, score, patterns, measures: insightMeasures } = item;
      const insightType = patterns?.[0]?.type;
      const chartConfig = visualizationSchemas?.[0];
      const insightCaption = chartConfig?.caption;

      const g2plotConfig = {
        chartType: G2PLOT_TYPES[chartConfig?.chartType ?? 'default'],
        config: {
          data: itemData,
          ...chartConfig?.chartSchema,
        },
      };

      const curChart: InputChart = {
        id: index,
        data: itemData,
        score,
        insightType,
        measures: insightMeasures?.map((item) => item.field),
        chartType: g2plotConfig?.chartType,
        chartSchema: g2plotConfig,
        description: insightCaption,
      };
      resultCharts.push(curChart);
    });

    return resultCharts;
  }

  private getAdvisorCharts(inputData: Datum[], measures?: Measure[], dimensions?: string[]) {
    const resultCharts: InputChart[] = [];
    const myAdvisor = new Advisor();

    let chartId = 0;
    if (measures && dimensions) {
      dimensions.forEach((dimensionItem) => {
        measures.forEach((measureItem) => {
          const aggData = statistics.aggregate(inputData, dimensionItem, measureItem.field);
          const curAdvices = myAdvisor.advise({
            data: aggData,
            fields: [dimensionItem, measureItem.field],
          });

          const curChart: InputChart = {
            id: chartId,
            data: aggData,
            measures: [measureItem.field],
            chartType: curAdvices?.[0]?.type,
            chartSchema: curAdvices?.[0]?.spec,
            chartScore: curAdvices?.[0]?.score,
          };
          chartId += 1;
          resultCharts.push(curChart);
        });
      });
    } else {
      const rowNames = Object.keys(inputData);
      rowNames?.forEach((rowName, rowId) => {
        for (let i = rowId; i < rowNames.length; i += 1) {
          const subName = rowNames[i];
          const aggData = statistics.aggregate(inputData, rowName, subName);
          const curAdvices = myAdvisor.advise({
            data: aggData,
            fields: [rowName, subName],
          });

          const curChart: InputChart = {
            id: chartId,
            data: aggData,
            measures: [subName],
            chartType: curAdvices?.[0]?.type,
            chartSchema: curAdvices?.[0]?.spec,
            chartScore: curAdvices?.[0]?.score,
          };
          chartId += 1;
          resultCharts.push(curChart);
        }
      });
    }

    return resultCharts;
  }

  /**
   * Get charts
   */
  get charts() {
    return this._charts || null;
  }

  /**
   * Get SB type
   */
  get type() {
    return this._sbType || null;
  }

  /**
   * Get SmartBoard
   */
  get board() {
    return this._board || null;
  }
}
