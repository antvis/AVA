/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Steps, Radio } from 'antd';
import ReactJson from 'react-json-view';
import * as G2Plot from '@antv/g2plot';
import { SheetComponent } from '@antv/s2';
import { getDataInsights } from '@antv/lite-insight';
import { statistics } from '@antv/data-wizard';
import { SmartBoard, SmartBoardToolbar, SmartBoardChartView } from '@antv/smart-board';

const { Step } = Steps;

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

const Dashboard = ({ chartList, interactionMode }) => {
  const smartBoard = new SmartBoard(chartList);
  const { chartGraph } = smartBoard;
  const chartOrder = smartBoard.chartOrder('byCluster');
  const chartCluster = smartBoard.chartCluster();
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

const ShowJSON = (json) => (
  <ReactJson src={json} iconStyle name={false} displayObjectSize={false} displayDataTypes={false} />
);

const ShowTable = (data, { height, width }) => {
  const s2DataConfig = { fields: { columns: Object.keys(data[0] || {}) }, data };
  const s2options = { width, height };

  return <SheetComponent dataCfg={s2DataConfig} options={s2options} sheetType="table" themeCfg={{ name: 'simple' }} />;
};

const dataRadioOptions = [
  { label: 'JSON', value: 'JSON' },
  { label: 'Table', value: 'Table' },
];

const insightTransfer = [
  {
    insight: 'category_outlier',
    board: 'outlier',
  },
  {
    insight: 'trend',
    board: 'trend',
  },
  {
    insight: 'change_point',
    board: 'difference',
  },
  {
    insight: 'time_series_outlier',
    board: 'outlier',
  },
  {
    insight: 'majority',
    board: 'extreme',
  },
  {
    insight: 'low_variance',
    board: 'distribution',
  },
];

const insights2Board = (insights) => {
  return insights?.map((item) => {
    return {
      data: item.data,
      id: item.id,
      subspaces: item.subspaces,
      breakdowns: item.breakdowns,
      measures: item.measures?.map((measure) => {
        return measure.field;
      }),
      score: item.score,
      chartType: item.visualizationSchemas?.[0]?.chartType,
      chartSchema: item.visualizationSchemas?.[0]?.chartSchema,
      description: item.visualizationSchemas?.[0]?.caption,
      insightType: insightTransfer.filter((type) => {
        return type.insight === item.patterns?.[0]?.type;
      })?.[0]?.board,
    };
  });
};

const App = () => {
  const [insights, setInsights] = useState({});
  const [data, setData] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [dataDisplayType, setDataDisplayType] = useState('Table');
  const [interactionMode, changeMode] = useState('defaultMode');

  const fetchDataset = async () => {
    fetch('https://cdn.jsdelivr.net/npm/vega-datasets@2.2.0/data/gapminder.json')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setData(data);
          const insightResult = getDataInsights(data, {
            limit: 10,
            measures: [
              { field: 'life_expect', method: 'MEAN' },
              { field: 'pop', method: 'SUM' },
              { field: 'fertility', method: 'MEAN' },
            ],
            // 洞察结果中会增加对应的可视化展示方案（基于g2plot）
            visualization: true,
          });
          setInsights(insightResult);
        }
      });
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  const dataContent = (
    <>
      <Radio.Group
        options={dataRadioOptions}
        onChange={(e) => setDataDisplayType(e.target.value)}
        value={dataDisplayType}
        optionType="button"
        buttonStyle="solid"
      />
      <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
        {dataDisplayType === 'Table' ? ShowTable(data, { height: 300, width: 700 }) : ShowJSON(data)}
      </div>
    </>
  );

  const insightsContent = (
    <>
      <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
        {ShowJSON(insights)}
      </div>
    </>
  );

  const plotContent = (
    <div className="page">
      <SmartBoardToolbar changeMode={changeMode} defaultMode={'connection'} />
      <Dashboard chartList={insights2Board(insights.insights)} interactionMode={interactionMode} />
    </div>
  );

  const steps = [
    {
      title: 'Data',
      desc: 'Source data:',
      content: dataContent,
    },
    {
      title: 'Insights',
      desc: 'Insights extracted from data:',
      content: insightsContent,
    },
    {
      title: 'Dashboard',
      desc: 'Represent insight with smart-board.',
      content: plotContent,
    },
  ];

  return (
    <>
      <Steps
        type="navigation"
        size="small"
        current={currentStep}
        onChange={setCurrentStep}
        style={{ marginBottom: '8px', boxShadow: '0px -1px 0 0 #e8e8e8 inset' }}
      >
        {steps.map((item) => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>

      <p>{steps[currentStep].desc}</p>

      <div className="steps-content" style={{ height: 'calc(100% - 80px)' }}>
        {steps[currentStep].content}
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
