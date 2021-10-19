import React, { useEffect, useState } from 'react';
import { Table, Select } from 'antd';
import G6 from '@antv/g6';
import { Advisor } from '../../../../packages/chart-advisor/src';
import { GraphData } from '../../../../packages/data-wizard/src';
import { ExampleDataset } from './SampleData';

const { Option } = Select;

export const GraphPlayground = () => {
  const defaultDataset = ExampleDataset[0];
  const [graphData, setGraphData] = useState(defaultDataset?.data);
  const [extra, setExtra] = useState();
  const [nodeColumns, setNodeColumns] = useState([]);
  const [edgeColumns, setEdgeColumns] = useState([]);
  const [g6Graph, setG6Graph] = useState(null);
  const ref = React.useRef(null);
  const myAdvisor = new Advisor();
  const handleDataSelect = (datasetId: any) => {
    const { data } = ExampleDataset.find((item) => item.id === datasetId)!;
    const id2Extra = {
      sankey: {
        childrenKey: 'to',
      },
      table: {
        sourceKey: 'Creditor',
        targetKey: 'Debtor',
      },
    };
    setGraphData(data);
    setExtra(id2Extra[datasetId]);
  };

  useEffect(() => {
    const cfg = myAdvisor.adviseForGraph({ data: graphData, options: extra });
    const parsedData = new GraphData(graphData, extra).data;
    console.warn('recommended cfg', cfg);
    setNodeColumns(parsedData.nodes);
    setEdgeColumns(parsedData.edges);
    const { layoutCfg } = cfg;
    if (!g6Graph) {
      const graph = new G6.Graph({
        container: ref.current,
        width: 800,
        height: 800,
        layout: layoutCfg,
      });
      graph.data(parsedData);
      graph.render();
      setG6Graph(graph);
    } else {
      g6Graph.data(parsedData);
      g6Graph.render();
    }
  }, [graphData]);

  return (
    <div>
      <div className="graph-data-container">
        <div>
          Dataset:
          <Select onChange={handleDataSelect} defaultValue={defaultDataset?.id} style={{ width: 160 }}>
            {ExampleDataset.map((item) => {
              return (
                <Option value={item.id} key={item.id}>
                  {item.name}
                </Option>
              );
            })}
          </Select>
        </div>
        {graphData.nodes?.length > 0 && (
          <Table
            size="small"
            rowKey={(_, index) => index}
            style={{ marginLeft: 10, marginRight: 10 }}
            dataSource={graphData.nodes}
            columns={nodeColumns}
          ></Table>
        )}
        {graphData.edges?.length > 0 && (
          <Table
            rowKey={(_, index) => index}
            size="small"
            style={{ marginLeft: 10, marginRight: 10 }}
            dataSource={graphData.edges}
            columns={edgeColumns}
          ></Table>
        )}
      </div>
      <div className="graph-canvas" ref={ref}></div>
    </div>
  );
};
