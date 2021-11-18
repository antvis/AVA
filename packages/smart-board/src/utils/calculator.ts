import { Chart } from '../interfaces';

type ConnectionType = 'SAME_DIMENSION' | 'SAME_MEASURE' | 'SAME_INSIGHT_TYPE';
type ConnectionTypes = ConnectionType[];

/**
 * Calculate the similarity between 2 charts by how many dimensions and measures they share
 * @param chart1
 * @param chart2
 * @returns
 */
function calSimilarityOfCharts(chart1: Chart, chart2: Chart): any {
  const b1 = chart1.dimensions;
  const b2 = chart2.dimensions;
  const m1 = chart1.measures;
  const m2 = chart2.measures;
  const dimIntersection = b1.filter((d) => b2.includes(d));
  const meaIntersection = m1.filter((d) => m2.includes(d));
  const description: ConnectionTypes = [];
  let isSameInsightType = false;

  if (dimIntersection.length) {
    const SD: ConnectionType = 'SAME_DIMENSION';
    description.push(SD);
  }
  if (meaIntersection.length) {
    const SM: ConnectionType = 'SAME_MEASURE';
    description.push(SM);
  }
  if (chart1.insightType === chart2.insightType) {
    const SI: ConnectionType = 'SAME_INSIGHT_TYPE';
    description.push(SI);
    isSameInsightType = true;
  }
  const dimSimilarity = dimIntersection.length / Math.max(b1.length, b2.length);
  const meaSimilarity = meaIntersection.length / Math.max(m1.length, m2.length);
  const insightSimilarity = isSameInsightType ? 1 : 0;
  const similarity = dimSimilarity / 3 + meaSimilarity / 3 + insightSimilarity / 3;
  return { similarity, description };
}

/**
 * Get the permutations of all pairs of charts
 * @param m
 * @param n
 * @param currentIndex
 * @param chosenArr
 * @param result
 * @returns
 */
function permutation(m: string[], n: number, currentIndex = 0, chosenArr: any = [], result: any = []): string[] {
  const mLen = m.length;
  if (currentIndex + n > mLen) {
    return [];
  }
  for (let i = currentIndex; i < mLen; i += 1) {
    if (n === 1) {
      result.push([...chosenArr, m[i]]);
      if (i + 1 < mLen) {
        permutation(m, n, i + 1, chosenArr, result);
      }
      break;
    }
    permutation(m, n - 1, i + 1, [...chosenArr, m[i]], result);
  }
  return result;
}

/**
 * Get Chart Connection.
 * Connection: the similarity between 2 charts.
 * @param ChartList
 * @returns
 */
export function getChartConnection(ChartList: Chart[]): any {
  const chartList = ChartList;
  const chartIDs = chartList.map((d) => d.id);
  const chartPairs = permutation(chartIDs, 2);
  const chartConnection = chartPairs.map((d) => {
    const chart1 = chartList[chartIDs.indexOf(d[0])];
    const chart2 = chartList[chartIDs.indexOf(d[1])];
    const { similarity, description } = calSimilarityOfCharts(chart1, chart2);
    return {
      chart1,
      chart2,
      similarity,
      description,
    };
  });
  return chartConnection;
}

/**
 * Get node degree of each chart that show how many edges the chart has in the chart graph
 * @param ChartList
 * @returns
 */
export function getDegreeImportance(ChartList: Chart[]): any {
  const chartConnection = getChartConnection(ChartList);
  const degreeOfchart = new Map();
  const chartsID = ChartList.map((d) => d.id);
  chartsID.forEach((d) => {
    degreeOfchart.set(d, 0);
  });
  chartConnection.forEach((d: { similarity: number; chart1: { id: any }; chart2: { id: any } }) => {
    if (d.similarity > 0) {
      degreeOfchart.set(d.chart1.id, degreeOfchart.get(d.chart1.id) + 1);
      degreeOfchart.set(d.chart2.id, degreeOfchart.get(d.chart2.id) + 1);
    }
  });
  return degreeOfchart;
}
