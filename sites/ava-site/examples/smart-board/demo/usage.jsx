/* eslint react/prop-types: 0 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import * as G2Plot from '@antv/g2plot';
import { statistics } from '@antv/data-wizard';
import { SmartBoard, SmartBoardToolbar, SmartBoardSelector, SmartBoardChartView } from '@antv/smart-board';

function g2plotRender(container, type, data, options) {
  const containerDOM = typeof container === 'string' ? document.getElementById(container) : container;
  if (!containerDOM) return null;
  const plot = new G2Plot[type](containerDOM, {
    height: 280,
    data,
    ...options,
  });
  plot.render();
  return plot;
}

const cars = 'https://cdn.jsdelivr.net/npm/vega-datasets@2/data/cars.json';

const chartSample1 = [
  {
    dataUrl: cars,
    subspaces: [],
    breakdowns: ['Origin'],
    measures: ['Horsepower'],
    fieldInfo: {
      Origin: {
        dataType: 'string',
      },
      Horsepower: {
        dataType: 'number',
      },
    },
    insightType: 'outlier',
    score: 0.5,
    chartType: 'column_chart',
  },
  {
    dataUrl: cars,
    subspaces: [],
    breakdowns: ['Year'],
    measures: ['Acceleration'],
    insightType: 'trend',
    score: 0.8,
    chartType: 'line_chart',
  },
  {
    dataUrl: cars,
    subspaces: [],
    breakdowns: ['Origin'],
    measures: ['Miles_per_Gallon'],
    insightType: 'proportion',
    score: 0.6,
    chartType: 'pie_chart',
  },
  {
    dataUrl: cars,
    subspaces: [],
    breakdowns: ['Cylinders', 'Origin'],
    measures: ['Displacement'],
    insightType: 'extreme',
    score: 0.85,
    chartType: 'grouped_column_chart',
  },
  {
    dataUrl: cars,
    subspaces: [],
    breakdowns: ['Year', 'Origin'],
    measures: ['Weight_in_lbs'],
    insightType: 'trend',
    score: 0.2,
    chartType: 'line_chart',
  },
  {
    dataUrl: cars,
    subspaces: [],
    breakdowns: ['Year'],
    measures: ['Displacement'],
    insightType: 'trend',
    score: 0.7,
    chartType: 'line_chart',
  },
];

const gapminder = 'https://cdn.jsdelivr.net/npm/vega-datasets@2/data/gapminder.json';

const chartSample2 = [
  {
    dataUrl: gapminder,
    subspaces: [],
    breakdowns: ['country'],
    measures: ['fertility'],
    fieldInfo: {
      country: {
        dataType: 'string',
      },
      Horsepower: {
        dataType: 'number',
      },
    },
    insightType: 'outlier',
    score: 0.5,
    chartType: 'column_chart',
  },
  {
    dataUrl: gapminder,
    subspaces: [],
    breakdowns: ['year'],
    measures: ['pop'],
    insightType: 'distribution',
    score: 0.7,
    chartType: 'line_chart',
  },
  {
    dataUrl: gapminder,
    subspaces: [],
    breakdowns: ['cluster'],
    measures: ['fertility'],
    insightType: 'proportion',
    score: 0.6,
    chartType: 'pie_chart',
  },
  {
    dataUrl: gapminder,
    subspaces: [],
    breakdowns: ['country', 'cluster'],
    measures: ['pop'],
    insightType: 'extreme',
    score: 0.85,
    chartType: 'grouped_column_chart',
  },
  {
    dataUrl: gapminder,
    subspaces: [],
    breakdowns: ['year', 'country'],
    measures: ['pop'],
    insightType: 'trend',
    score: 0.2,
    chartType: 'line_chart',
  },
  {
    dataUrl: gapminder,
    subspaces: [],
    breakdowns: ['year'],
    measures: ['pop'],
    insightType: 'trend',
    score: 0.8,
    chartType: 'line_chart',
  },
];

const CHART_SAMPLE_LIST = [chartSample1, chartSample2];

const Dashboard = ({ chartList, interactionMode }) => {
  const smartBoard = new SmartBoard(chartList);
  const { chartGraph } = smartBoard;
  const chartOrder = smartBoard.chartOrder('byCluster');
  const chartCluster = smartBoard.chartCluster();
  // when the interactionMode is connection mode and a chart was selected, filter and resort charts
  const sortedChartList = new Array(chartList.length);
  chartGraph.nodes.forEach((d) => {
    sortedChartList[chartOrder[d.id]] = d;
  });

  const [connectionID, changeConnectionID] = useState('');
  useEffect(() => {
    return () => {};
  }, [connectionID]);

  let curChartList = sortedChartList;
  const chartID = sortedChartList.map((d) => d.id);
  if (chartID.includes(connectionID) && interactionMode === 'connectionMode') {
    const connectionLinks = chartGraph.links.filter((d) => d.source === connectionID || d.target === connectionID);
    const connectionNodes = connectionLinks.map((d) => (d.source === connectionID ? d.target : d.source));

    connectionLinks.forEach((d, i) => {
      const id = connectionNodes[i];
      const chart = sortedChartList[chartID.indexOf(id)];
      chart.description = d.description;
    });

    connectionNodes.unshift(connectionID);
    const filteredChartList = [];

    connectionNodes.forEach((d) => {
      const chart = sortedChartList[chartID.indexOf(d)];
      filteredChartList.push(chart);
    });
    curChartList = filteredChartList;
  }

  const quitResort = () => {
    curChartList = sortedChartList;
    changeConnectionID('');
  };

  return (
    <div id="dashboard">
      {curChartList.map((chart) => {
        const clusterIndex = chartCluster[chart.id];
        return (
          <SmartBoardChartView
            key={chart.id}
            chartID={chart.id}
            chartInfo={chart}
            interactionMode={interactionMode}
            clusterID={`cluster_${clusterIndex}`}
            hasLocked={!!connectionID} // if there exist connectionID, it means the dashboard comes into connection view
            aggregate={statistics.aggregate}
            g2plotRender={g2plotRender}
            changeConnectionID={changeConnectionID}
            quitResort={quitResort}
          />
        );
      })}
    </div>
  );
};

const App = () => {
  const [interactionMode, changeMode] = useState('defaultMode');
  const [chartSamplesIndex, changeSampleIndex] = useState(0);

  const boardSamples = {
    sampleNames: ['chartSample1', 'chartSample2'],
    initSampleMode: interactionMode,
  };

  return (
    <div className="page">
      <SmartBoardSelector changeSampleIndex={changeSampleIndex} samples={boardSamples} />
      <SmartBoardToolbar changeMode={changeMode} />
      <Dashboard chartList={CHART_SAMPLE_LIST[chartSamplesIndex]} interactionMode={interactionMode} />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
