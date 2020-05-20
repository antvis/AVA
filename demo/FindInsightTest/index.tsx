import React, { useState, useEffect, useCallback } from 'react';
import { AVAChart } from './Charts';
import { dataInTable, dataInJSON, debounce } from '../utils';
import {
  getInsightSpaces,
  IWorker,
  workerCollection,
  ISpace,
  DefaultIWorker,
} from '../../packages/chart-advisor/src/insight';
import ReactJson from 'react-json-view';
import { RowData } from '../../packages/datawizard/transform/src';

const exampleIWorkerName = 'cardinality';

const exampleIWorker: IWorker = async (aggData, dimensions, measures) => {
  if (dimensions.length === 0 || measures.length === 0 || aggData.length === 0) return null;
  const sig = 1 / Math.pow(dimensions.length * measures.length * aggData.length, 1 / 4);
  return {
    dimensions,
    measures,
    significance: sig,
    type: exampleIWorkerName,
  };
};
workerCollection.register(exampleIWorkerName, exampleIWorker);

const WORKER_LIST: Array<{ id: string; name: string }> = [
  {
    id: DefaultIWorker.cluster,
    name: '群簇(Cluster)',
  },
  {
    id: DefaultIWorker.trend,
    name: '趋势(Trend)',
  },
  {
    id: DefaultIWorker.outlier,
    name: '异常(Outlier)',
  },
  {
    id: exampleIWorkerName,
    name: '基数(Cardinality)',
  },
];

export function FindInsightTest() {
  const [dataSource, setDataSource] = useState<RowData[]>([]);
  const [sig, setSig] = useState(0.5);
  const [filteredInsights, setFilteredInsights] = useState<any[]>([]);
  const [insightSpaces, setInsightSpaces] = useState<ISpace[]>([]);
  const [workerStatus, setWorkerStatus] = useState<boolean[]>(WORKER_LIST.map(() => true));

  useEffect(() => {
    fetch('https://vega.github.io/vega-datasets/data/cars.json')
      .then((res) => res.json())
      .then((res: RowData[]) => {
        setDataSource(res);
      });
  }, []);
  useEffect(() => {
    if (dataSource.length > 0) {
      // 使用workerCollection.enable(workerId, 状态)，来决定洞察计算时是否会调用该worker
      workerStatus.forEach((status, index) => {
        workerCollection.enable(WORKER_LIST[index].id, status);
      });
      getInsightSpaces({
        dataSource: dataSource,
        fields: [
          'Year',
          'Origin',
          'Miles_per_Gallon',
          'Cylinders',
          'Displacement',
          'Horsepower',
          'Weight_in_lbs',
          'Acceleration',
        ],
        collection: workerCollection,
        enableUniqueFields: false,
      }).then((spaces) => {
        setInsightSpaces(spaces);
      });
    }
  }, [dataSource, workerStatus]);

  const _setFilteredInsights = useCallback(
    debounce((threshold: number) => {
      const insights = insightSpaces.filter((space) => space.significance >= threshold);
      setFilteredInsights(insights);
    }, 300),
    [insightSpaces]
  );

  useEffect(() => {
    _setFilteredInsights(sig);
  }, [sig, insightSpaces]);

  const onWorkerStatusChange = useCallback((e) => {
    const workerId = e.target.name;
    const workerIndex = WORKER_LIST.findIndex((w) => w.id === workerId);
    setWorkerStatus((status) => {
      const nextStatus = [...status];
      nextStatus[workerIndex] = !nextStatus[workerIndex];
      return nextStatus;
    });
  }, []);

  return (
    <>
      {/* data */}
      <div style={{ display: 'flex', justifyContent: 'space-evenly', minHeight: '200px', maxHeight: '300px' }}>
        {dataInJSON(dataSource)}
        {dataInTable(dataSource)}
      </div>
      {/* insights */}
      {/* <div style={{ display: 'flex', justifyContent: 'space-evenly', minHeight: '200px', maxHeight: '300px' }}>
        {dataInJSON(insights, 'insights found:')}
      </div> */}
      <div style={{ padding: '2em' }}>
        <div>
          <label htmlFor="threshold-range">洞察显著性阈值(Threshold of Insight Significance): {sig}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(sig * 100)}
            onChange={(e) => {
              setSig(Number(e.target.value) / 100);
            }}
            name="threshold-range"
            id="threshold-range"
          />
        </div>
        <div>
          {WORKER_LIST.map((worker, wIndex) => (
            <div key={worker.id} style={{ display: 'inline-block', marginRight: '20px' }}>
              <label htmlFor={worker.id}>{worker.name}</label>
              <input
                checked={workerStatus[wIndex]}
                onChange={onWorkerStatusChange}
                type="checkbox"
                name={worker.id}
                id={worker.id}
              />
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          minHeight: '200px',
          maxHeight: '300px',
          overflow: 'auto',
        }}
      >
        <ReactJson src={filteredInsights} displayDataTypes={false} />
      </div>
      {/* insights charts */}
      <h3>Insights Dashboard</h3>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {filteredInsights.slice(0, 20).map((chart) => (
          <div
            style={{ width: '480px', height: '420px' }}
            key={`${chart.type}-${chart.dimensions.join('-')}|${chart.measures.join('-')}`}
          >
            <AVAChart
              dataSource={dataSource}
              dimensions={chart.dimensions}
              measures={chart.measures}
              aggregator="sum"
            />
          </div>
        ))}
      </div>
    </>
  );
}
