/* eslint react/prop-types: 0 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Tag, Radio, Tooltip, Select } from 'antd';
import * as G2Plot from '@antv/g2plot';
import {
  InsertRowBelowOutlined,
  ClusterOutlined,
  InteractionOutlined,
  LockOutlined,
  UnlockOutlined,
  MonitorOutlined,
} from '@ant-design/icons';
import { SmartBoard, smartBoardConfig } from '@antv/smart-board';

import './index.less';

const { Option } = Select;

const maxBy = (arr, fn) => Math.max(...arr.map(typeof fn === 'function' ? fn : (val) => val[fn]));

const minBy = (arr, fn) => Math.min(...arr.map(typeof fn === 'function' ? fn : (val) => val[fn]));

const meanBy = (arr, fn) =>
  arr.map(typeof fn === 'function' ? fn : (val) => val[fn]).reduce((acc, val) => acc + val, 0) / arr.length;

const sumBy = (arr, fn) => arr.map(typeof fn === 'function' ? fn : (val) => val[fn]).reduce((acc, val) => acc + val, 0);

const groupBy = (collection, iteratee = (x) => x) => {
  const it = typeof iteratee === 'function' ? iteratee : ({ [iteratee]: prop }) => prop;

  const array = Array.isArray(collection) ? collection : Object.values(collection);

  return array.reduce((r, e) => {
    const k = it(e);

    /* eslint-disable no-param-reassign */
    r[k] = r[k] || [];

    r[k].push(e);

    return r;
  }, {});
};

function flatten(arr) {
  let res = [];
  /* eslint-disable no-restricted-syntax */
  for (const el of arr) {
    if (Array.isArray(el)) {
      res = res.concat(flatten(el));
    } else {
      res.push(el);
    }
  }
  return res;
}

const sum = (data, measure) => {
  return sumBy(data, measure);
};

const count = (data, measure) => {
  return data.filter((item) => measure in item).length;
};

const max = (data, measure) => {
  return maxBy(data, measure)?.[measure];
};

const min = (data, measure) => {
  return minBy(data, measure)?.[measure];
};

const mean = (data, measure) => {
  return meanBy(data, measure);
};

const AggregatorMap = {
  SUM: sum,
  COUNT: count,
  MAX: max,
  MIN: min,
  MEAN: mean,
};

/**
 * Data aggregation function
 * @param data
 * @param dimensionField
 * @param measure
 * @param seriesField
 * @returns
 */
const aggregate = (data, dimensionField, measure, seriesField, aggMethod = 'SUM') => {
  const grouped = groupBy(data, dimensionField);
  const aggregator = AggregatorMap[aggMethod];
  if (!seriesField) {
    return Object.entries(grouped).map(([value, dataGroup]) => {
      return {
        [dimensionField]: value,
        [measure]: aggregator(dataGroup, measure),
      };
    });
  }
  return flatten(
    Object.entries(grouped).map(([value, dataGroup]) => {
      const childGrouped = groupBy(dataGroup, seriesField);
      const part = Object.entries(childGrouped).map(([childValue, childDataGroup]) => {
        return {
          [seriesField]: childValue,
          [measure]: sum(childDataGroup, measure),
        };
      });
      return part.map((item) => {
        return {
          ...item,
          [dimensionField]: value,
        };
      });
    })
  );
};

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
    data: cars,
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
    data: cars,
    subspaces: [],
    breakdowns: ['Year'],
    measures: ['Acceleration'],
    insightType: 'trend',
    score: 0.8,
    chartType: 'line_chart',
  },
  {
    data: cars,
    subspaces: [],
    breakdowns: ['Origin'],
    measures: ['Miles_per_Gallon'],
    insightType: 'proportion',
    score: 0.6,
    chartType: 'pie_chart',
  },
  {
    data: cars,
    subspaces: [],
    breakdowns: ['Cylinders', 'Origin'],
    measures: ['Displacement'],
    insightType: 'extreme',
    score: 0.85,
    chartType: 'grouped_column_chart',
  },
  {
    data: cars,
    subspaces: [],
    breakdowns: ['Year', 'Origin'],
    measures: ['Weight_in_lbs'],
    insightType: 'trend',
    score: 0.2,
    chartType: 'line_chart',
  },
  {
    data: cars,
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
    data: gapminder,
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
    data: gapminder,
    subspaces: [],
    breakdowns: ['year'],
    measures: ['pop'],
    insightType: 'distribution',
    score: 0.7,
    chartType: 'line_chart',
  },
  {
    data: gapminder,
    subspaces: [],
    breakdowns: ['cluster'],
    measures: ['fertility'],
    insightType: 'proportion',
    score: 0.6,
    chartType: 'pie_chart',
  },
  {
    data: gapminder,
    subspaces: [],
    breakdowns: ['country', 'cluster'],
    measures: ['pop'],
    insightType: 'extreme',
    score: 0.85,
    chartType: 'grouped_column_chart',
  },
  {
    data: gapminder,
    subspaces: [],
    breakdowns: ['year', 'country'],
    measures: ['pop'],
    insightType: 'trend',
    score: 0.2,
    chartType: 'line_chart',
  },
  {
    data: gapminder,
    subspaces: [],
    breakdowns: ['year'],
    measures: ['pop'],
    insightType: 'trend',
    score: 0.8,
    chartType: 'line_chart',
  },
];

const CHART_SAMPLE_LIST = [chartSample1, chartSample2];

const ChartView = ({ chartID, chartInfo, clusterID, interactionMode, hasLocked, changeConnectionID, quitResort }) => {
  const [curChartConfig, setChartConfig] = useState();
  let plot;

  useEffect(() => {
    fetch(chartInfo.data)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        const chartConfig = smartBoardConfig(chartInfo, data);
        const { xField, yField, colorField, angleField, seriesField } = chartConfig.config;

        let aggregatedData = data;
        if ((xField || colorField) && (yField || angleField)) {
          aggregatedData = aggregate(data, xField || colorField || '', yField || angleField || '', seriesField);
        }

        setChartConfig(chartConfig);
        plot = g2plotRender(`chart_container_${chartID}`, chartConfig.type, aggregatedData, chartConfig.config);
      });
    return function cleanup() {
      if (plot) {
        plot.destroy();
      }
    };
  }, [chartID, chartInfo, hasLocked]);

  const [chartClassName, setChartClassName] = useState('chart-view');
  useEffect(() => {
    setChartClassName(`chart_view ${interactionMode === 'clusterMode' ? clusterID : ''}`);
  }, [interactionMode]);

  const [isLocked, toggleLocked] = useState(false);
  const handleResort = () => {
    changeConnectionID(chartID);
    toggleLocked(!isLocked);
  };

  const cancelResort = () => {
    quitResort();
    toggleLocked(!isLocked);
  };

  const lockIcon = isLocked ? (
    <Tooltip title={'Cancel Connection'}>
      <LockOutlined
        className="resort_icon"
        style={{ color: 'red', visibility: interactionMode === 'connectionMode' ? 'visible' : 'hidden' }}
        onClick={cancelResort}
      />
    </Tooltip>
  ) : (
    <Tooltip title={'Show Connection'}>
      <UnlockOutlined
        className="resort_icon"
        style={{ visibility: interactionMode === 'connectionMode' && !hasLocked ? 'visible' : 'hidden' }}
        onClick={handleResort}
      />
    </Tooltip>
  );

  const config = curChartConfig?.config;
  const dimension =
    curChartConfig?.type !== 'Pie' ? `${config?.xField} ${config?.seriesField || ''}` : config?.colorField;
  const measure = curChartConfig?.type !== 'Pie' ? config?.yField : config?.angleField;
  const score = curChartConfig?.score;
  const { description } = chartInfo;

  const linkTag = {
    SAME_DIMENSION: 'SD',
    SAME_MEASURE: 'SM',
    SAME_INSIGHT_TYPE: 'SI',
  };

  return (
    <div className={chartClassName} id={`chart_view_${chartID}`}>
      <div className="title_view">
        <div className="title_info">
          {score && (
            <Tooltip title={`Score: ${score}`}>
              <Tag icon={<MonitorOutlined />} color="error">{`${score}`}</Tag>
            </Tooltip>
          )}
          {dimension && (
            <Tooltip title={`Dimension: ${dimension}`}>
              <Tag color="processing">{`${dimension}`}</Tag>
            </Tooltip>
          )}
          {measure && (
            <Tooltip title={`Measure: ${measure}`}>
              <Tag color="success">{`${measure}`}</Tag>
            </Tooltip>
          )}
        </div>
        <div className="right_icons">{lockIcon}</div>
      </div>
      <div id={`chart_container_${chartID}`}></div>
      {hasLocked &&
        description &&
        description.map((d) => {
          return (
            <Tooltip key={d} title={d}>
              <Tag>{linkTag[d]}</Tag>
            </Tooltip>
          );
        })}
    </div>
  );
};

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
          <ChartView
            key={chart.id}
            chartID={chart.id}
            chartInfo={chart}
            interactionMode={interactionMode}
            clusterID={`cluster_${clusterIndex}`}
            hasLocked={!!connectionID} // if there exist connectionID, it means the dashboard comes into connection view
            changeConnectionID={changeConnectionID}
            quitResort={quitResort}
          />
        );
      })}
    </div>
  );
};

const Toolbar = ({ changeMode, changeSampleIndex }) => {
  const handleModeChange = (e) => {
    changeMode(e.target.value);
  };
  const handleSampleChange = (value) => {
    changeSampleIndex(value);
  };

  return (
    <div id="toolbar">
      <div id="demo-selection">
        <Select
          id="sample-select"
          defaultValue="sample1"
          style={{ width: 120 }}
          size="small"
          onChange={handleSampleChange}
        >
          <Option value="0">sample1</Option>
          <Option value="1">sample2</Option>
        </Select>
      </div>
      <Radio.Group defaultValue="defaultMode" size="small" onChange={handleModeChange}>
        <Radio.Button value="defaultMode">
          <Tooltip title={'Default Mode'}>
            <InsertRowBelowOutlined className="toolbar_icons" />
          </Tooltip>
        </Radio.Button>
        <Radio.Button value="clusterMode">
          <Tooltip title={'Cluster Mode'}>
            <ClusterOutlined className="toolbar_icons" />
          </Tooltip>
        </Radio.Button>
        <Radio.Button value="connectionMode">
          <Tooltip title={'Connection Mode'} placement="bottomRight" arrowPointAtCenter>
            <InteractionOutlined className="toolbar_icons" />
          </Tooltip>
        </Radio.Button>
      </Radio.Group>
    </div>
  );
};

const App = () => {
  const [interactionMode, changeMode] = useState('defaultMode');
  const [chartSamplesIndex, changeSampleIndex] = useState(0);

  return (
    <div className="page">
      <Toolbar changeMode={changeMode} changeSampleIndex={changeSampleIndex} />
      <Dashboard chartList={CHART_SAMPLE_LIST[chartSamplesIndex]} interactionMode={interactionMode} />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
