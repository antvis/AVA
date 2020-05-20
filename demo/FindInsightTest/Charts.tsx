import React, { useRef, useEffect, useMemo, useState } from 'react';
import { aggregate, Operations } from '../../packages/datawizard/transform/src';
import { autoChart } from '../../packages/chart-advisor/src';
import { RowData } from '../../packages/datawizard/transform/typings/dw-transform';
import ReactJson from 'react-json-view';

function filterDataByFields(data: RowData[], fields: string[]): RowData[] {
  return data.map((row) => {
    const newRow: RowData = {};
    fields.forEach((field) => {
      newRow[field] = row[field];
    });
    return newRow;
  });
}
interface AVAChartProps {
  dataSource: RowData[];
  dimensions: string[];
  measures: string[];
  aggregator: Operations;
}

export const AVAChart: React.FC<AVAChartProps> = (props) => {
  // eslint-disable-next-line react/prop-types
  const { dataSource, dimensions, measures, aggregator } = props;
  const container = useRef<HTMLDivElement>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);

  const viewData = useMemo(() => {
    const fields = [...dimensions, ...measures];
    const aggData = aggregate(dataSource, {
      as: measures,
      fields: measures,
      groupBy: dimensions,
      // eslint-disable-next-line react/prop-types
      op: measures.map(() => aggregator),
    });
    return filterDataByFields(aggData, fields);
  }, [dataSource, dimensions, measures, aggregator]);
  useEffect(() => {
    if (container.current) {
      autoChart(container.current, viewData);
    }
  }, [viewData]);

  return (
    <div
      onDoubleClick={() => {
        setShowDetail((v) => !v);
      }}
    >
      <div ref={container}></div>
      {showDetail && (
        <div
          style={{
            position: 'absolute',
            backgroundColor: '#fff',
            boxShadow: '0px 0px 10px #979797',
            zIndex: 100,
            width: '400px',
            maxHeight: '500px',
            overflow: 'auto',
          }}
        >
          <ReactJson src={viewData} />
        </div>
      )}
    </div>
  );
};
