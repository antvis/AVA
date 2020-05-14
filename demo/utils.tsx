import React from 'react';

export function prettyJSON(json: any) {
  return JSON.stringify(
    json,
    function(_, v) {
      for (const p in v) {
        if (v[p] instanceof Object) {
          return v;
        }
      }
      return JSON.stringify(v, null, 1);
    },
    2
  )
    .replace(/\\n/g, '')
    .replace(/\\/g, '')
    .replace(/"\[/g, '[')
    .replace(/\]"/g, ']')
    .replace(/"\{/g, '{')
    .replace(/\}"/g, ' }');
}

export function JSONToTable(jsonArray: any) {
  if (!Array.isArray(jsonArray)) {
    return <div>Data is NOT array!</div>;
  }

  if (jsonArray.length === 0) {
    return <div>Data array is empty!</div>;
  }

  const fields = Object.keys(jsonArray[0]);

  return (
    <table className="columnTable">
      <thead>
        <tr>
          {fields.map((fieldTitle) => {
            return <th key={fieldTitle}>{fieldTitle}</th>;
          })}
        </tr>
      </thead>
      <tbody>
        {jsonArray.map((row, index) => (
          <tr key={index}>
            {fields.map((field) => (
              <td key={field}>{`${row[field]}`}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const dataInJSON = (data: any, title = 'Data in JSON') => (
  <div style={{ display: 'flex', flexDirection: 'column', width: '30%' }}>
    <h4>{title}</h4>
    <textarea style={{ height: '100%', overflowY: 'scroll' }} value={prettyJSON(data)} />
  </div>
);

export const dataInTable = (data: any, title = 'Data in Table') => (
  <div style={{ display: 'flex', flexDirection: 'column', width: '30%' }}>
    <h4>{title}</h4>
    <div style={{ height: '100%', overflowY: 'scroll' }}>{JSONToTable(data)}</div>
  </div>
);

export interface Record {
  [key: string]: any;
}

export type Aggregator = (subDataSource: Record[], measures: string[]) => Record;
/**
 * 分组聚合函数
 * @param dataSource 数据源,扁平的对象数组
 * @param dimensions 维度
 * @param measures 度量
 * @param aggregator 聚合函数
 */
export function aggregate(
  dataSource: Record[],
  dimensions: string[],
  measures: string[],
  aggregator: Aggregator
): Record[] {
  const aggData: Record[] = [];
  // 根据维度进行分组
  const groups: Map<string, Record[]> = new Map();
  for (const record of dataSource) {
    const key = dimensions.map((dim) => record[dim]).join('-');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(record);
  }
  // 对每一组聚合
  for (const group of groups) {
    const aggRecord = aggregator(group[1], measures);
    const dimValues = group[0].split('-');
    dimensions.forEach((dim, index) => {
      aggRecord[dim] = dimValues[index];
    });
    aggData.push(aggRecord);
  }
  return aggData;
}

export function debounce(func: Function, delay: number) {
  let timer: NodeJS.Timeout | null = null;
  function debounced(props: any) {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(function() {
      func(props);
    }, delay);
  }
  return debounced;
}
