/* eslint react/prop-types: 0 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { SmartBoard, SmartBoardDashboard, SmartBoardToolbar, SmartBoardSelector } from '@antv/smart-board';

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

const App = () => {
  const [interactionMode, changeMode] = useState('defaultMode');
  const [chartSamplesIndex, changeSampleIndex] = useState(0);

  const boardSamples = {
    sampleNames: ['chartSample1', 'chartSample2'],
    initSampleMode: 'defaultMode',
  };

  const [smartBoard, setSmartBoard] = useState(new SmartBoard(CHART_SAMPLE_LIST[chartSamplesIndex]));

  useEffect(() => {
    const updateSmartBoard = new SmartBoard(CHART_SAMPLE_LIST[chartSamplesIndex]);
    setSmartBoard(updateSmartBoard);
  }, [CHART_SAMPLE_LIST[chartSamplesIndex]]);

  return (
    <div className="page">
      <SmartBoardSelector changeSampleIndex={changeSampleIndex} samples={boardSamples} />
      <SmartBoardToolbar changeMode={changeMode} />
      <SmartBoardDashboard
        chartList={CHART_SAMPLE_LIST[chartSamplesIndex]}
        interactionMode={interactionMode}
        chartGraph={smartBoard?.chartGraph}
        chartOrder={smartBoard?.chartOrder('byCluster')}
        chartCluster={smartBoard?.chartCluster()}
      />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
