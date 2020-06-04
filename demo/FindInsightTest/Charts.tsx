import React, { useRef, useEffect, useMemo, useState } from 'react';
import { autoTransform } from '../../packages/datawizard/transform/src';
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
  fields: string[];
  options: any;
}

export const AVAChart: React.FC<AVAChartProps> = (props) => {
  // eslint-disable-next-line react/prop-types
  const { dataSource, fields, options } = props;
  const container = useRef<HTMLDivElement>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);

  const viewData = useMemo(() => {
    const filteredData = filterDataByFields(dataSource, fields);
    const { result } = autoTransform(filteredData, false);
    return result;
  }, [dataSource, fields]);

  useEffect(() => {
    if (container.current) {
      autoChart(container.current, viewData, options);
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
