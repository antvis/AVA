import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AVAChart } from './Charts';
import { dataInTable, dataInJSON, Record, debounce } from '../utils';
import { getInsightSpaces } from '../../packages/chart-advisor/src/insight';
import ReactJson from 'react-json-view';

function sum(dataSource: Record[], measures: string[]): Record {
  const result: Record = {};
  measures.forEach((mea) => {
    result[mea] = 0;
  });
  return dataSource.reduce((total, record) => {
    measures.forEach((mea) => {
      total[mea] += record[mea];
    });
    return total;
  }, result);
}

export function FindInsightTest() {
  const [dataSource, setDataSource] = useState<Record[]>([]);
  const [sig, setSig] = useState(0.5);
  const [filteredInsights, setFilteredInsights] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://vega.github.io/vega-datasets/data/cars.json')
      .then((res) => res.json())
      .then((res: Record[]) => {
        setDataSource(res);
      });
  }, []);

  const devInsights = useMemo(() => {
    if (dataSource.length === 0) return [];
    return getInsightSpaces({
      dataSource: dataSource,
      dimensions: ['Year', 'Origin'],
      measures: ['Miles_per_Gallon', 'Cylinders', 'Displacement', 'Horsepower', 'Weight_in_lbs', 'Acceleration'],
    });
  }, [dataSource]);

  const _setFilteredInsights = useCallback(
    debounce((threshold: number) => {
      const insights = devInsights.filter((space) => space.significance >= threshold);
      setFilteredInsights(insights);
    }, 300),
    [devInsights]
  );

  useEffect(() => {
    _setFilteredInsights(sig);
  }, [sig, devInsights]);

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
      Insight Significance: {sig} <br />
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(sig * 100)}
        onChange={(e) => {
          setSig(Number(e.target.value) / 100);
        }}
        id="myRange"
      />
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
          <AVAChart
            key={`${chart.type}-${chart.dimensions.join('-')}|${chart.measures.join('-')}`}
            dataSource={dataSource}
            dimensions={chart.dimensions}
            measures={chart.measures}
            aggregator={sum}
          />
        ))}
      </div>
    </>
  );
}
