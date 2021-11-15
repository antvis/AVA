/* eslint-disable no-underscore-dangle */
// @ts-ignore
import * as louvain from 'louvain-algorithm';
import { Chart, InputChart, ChartOrder, ChartGraph, ChartCluster, link } from '../interfaces';
import { getDegreeImportance, getChartConnection } from '../utils/calculator';
import { addUuid } from '../utils/addUuid';

/**
 * SmartBoard
 * @public
 */
export class SmartBoard {
  private charts: Chart[];

  private _chartGraph: ChartGraph | undefined;

  /**
   * initialize chart:
   * - add id if there is no id of chart;
   * - transform type from 'InputChart' to 'Chart'.
   * @param chart
   * @returns
   */
  private initChart(chart: InputChart) {
    // if there is no chart ID, add it using uuid4
    if (!chart.id) {
      addUuid(chart);
    }
    const initializedChart: Chart = Object.assign(chart);
    return initializedChart;
  }

  constructor(inputCharts: InputChart[]) {
    // if there are duplicate chart IDs, return error message
    const chartIDs = inputCharts.map((d) => d.id).filter((d) => d !== undefined);
    const set = new Set(chartIDs);
    if (set.size !== chartIDs.length) {
      throw new Error('There are duplicate chart IDs, please check it.');
    }
    // init charts
    const initializedCharts = inputCharts.map((chart) => {
      return this.initChart(chart);
    });
    this.charts = initializedCharts;
  }

  addChart(newChart: InputChart) {
    const chartIDs = this.charts.map((d) => d.id);
    if (newChart.id && chartIDs.includes(newChart.id)) {
      throw new Error('The new chart id is duplicated with the previous chart, please change the chart ID.');
    } else {
      const initNewChart = this.initChart(newChart);
      this.charts.push(initNewChart);
    }
  }

  /**
   * Get chart graph
   */
  get inputCharts() {
    if (!this.charts) {
      return null;
    }
    return this.charts;
  }

  /**
   * Get chart graph
   */
  get chartGraph() {
    if (!this._chartGraph) {
      this.generateChartGraph();
    }
    return this._chartGraph;
  }

  /**
   * Calculate the chart graph
   * The graph structure is defined with reference to G6
   * @param ChartListInfo
   * @returns
   */
  private generateChartGraph() {
    const connection = getChartConnection(this.charts);
    const links: link[] = [];
    connection.forEach((d: any) => {
      if (d.similarity > 0) {
        links.push({
          source: d.chart1.id,
          target: d.chart2.id,
          weight: d.similarity,
          description: d.description,
        });
      }
    });
    const _chartGraph = {
      nodes: this.charts,
      links,
    };
    this._chartGraph = _chartGraph;
  }

  /**
   * Calculate the chart score considering the insight score and the node degree importance and order them
   * @param ChartListInfo
   * @returns
   */
  chartOrder(type?: 'byInsightScore' | 'byCluster'): ChartOrder {
    if (!type || type === 'byInsightScore') {
      const chartsScore = this.charts
        .map((d) => {
          return {
            id: d.id,
            insightScore: d.score || 0,
          };
        })
        .sort((a, b) => b.insightScore - a.insightScore);
      const chartOrderID = chartsScore.map((d) => d.id);
      const chartOrderByInsigitScore = new Map();
      this.charts.forEach((d) => {
        chartOrderByInsigitScore.set(d.id, chartOrderID.indexOf(d.id));
      });
      return Object.fromEntries(chartOrderByInsigitScore);
    }

    // get chart order base on chartGraph
    if (type === 'byCluster') {
      if (!this._chartGraph) {
        this.generateChartGraph();
      }
      const cluster = this.chartCluster();
      const clusterIDSet = new Set(Object.values(cluster));
      const degreeOfchart = getDegreeImportance(this.charts);
      const a = 0.5;
      const b = 0.5;
      const clusterChartSet = this.charts.map((d) => {
        return {
          id: d.id,
          clusterID: cluster[d.id],
          computedScore: (d.score || 0) * a + (degreeOfchart.get(d.id) / (this.charts.length - 1)) * b,
        };
      });

      const clusterChartGroup = Array.from(clusterIDSet).map((id) => {
        return clusterChartSet.filter((d) => d.clusterID === id);
      });
      const clusterChartGroupWithScore = clusterChartGroup
        .map((d) => {
          return {
            clusterID: d[0].clusterID,
            avgScore: d.map((chart) => chart.computedScore).reduce((a, b) => a + b) / d.length,
            charts: d.sort((a, b) => b.computedScore - a.computedScore), // sort the charts inside the cluster
          };
        })
        .sort((a, b) => b.avgScore - a.avgScore); // sort with the avgScore of each cluster
      const chartOrderID: string[] = [];
      clusterChartGroupWithScore.forEach((d) => {
        d.charts.forEach((chart) => {
          chartOrderID.push(chart.id);
        });
      });
      const chartOrderByCluster = new Map();
      this.charts.forEach((d) => {
        chartOrderByCluster.set(d.id, chartOrderID.indexOf(d.id));
      });
      return Object.fromEntries(chartOrderByCluster);
    }
    throw new Error('Invalid argument.');
  }

  /**
   * Get chart cluster using the Louvain algorithm (https://www.npmjs.com/package/louvain-algorithm)
   * @param chartsID
   * @param ChartGraph
   * @returns
   */
  chartCluster(): ChartCluster {
    const chartsID = this.charts.map((c) => c.id);
    if (!this._chartGraph) {
      this.generateChartGraph();
    }
    const MIN_DIFF_SHRESHOLD = 0.0000001;
    const node2com = louvain.jLouvain(chartsID, this._chartGraph?.links, MIN_DIFF_SHRESHOLD);
    return node2com;
  }
}
