import React, { useEffect, useState } from 'react';
import G6 from '@antv/g6';
import { Collapse, Table } from 'antd';
import { specToG6 } from './spec-g6';

export const Graph = ({ spec }: any) => {
  const [g6Cfg, setG6Cfg] = useState(null);
  const [g6Graph, setG6Graph] = useState(null);
  const [nodeColumns, setNodeColumns] = useState([]);
  const [linkColumns, setLinkColumns] = useState([]);
  const ref = React.useRef(null);

  useEffect(() => {
    setG6Cfg(specToG6(spec));
  }, [spec]);

  useEffect(() => {
    if (g6Cfg) {
      const newNodeColumns = Object.keys(g6Cfg.data.nodes[0]).map((key) => {
        return {
          title: key,
          dataIndex: key,
          key,
        };
      });
      const newLinkColumns = Object.keys(g6Cfg.data.edges[0]).map((key) => {
        return {
          title: key,
          dataIndex: key,
          key,
        };
      });
      setNodeColumns(newNodeColumns);
      setLinkColumns(newLinkColumns);

      if (g6Graph) g6Graph.destroy();
      const graph = new G6.Graph({
        container: ref.current,
        ...g6Cfg.cfg,
      });
      graph.data(g6Cfg.data);
      graph.render();
      setG6Graph(graph);
    }
  }, [g6Cfg]);

  return (
    <div>
      <Collapse defaultActiveKey={['1']}>
        <Collapse.Panel header="Graph Visualization" key="1">
          <div className="graph-canvas" ref={ref}></div>
        </Collapse.Panel>
        <Collapse.Panel header="Recommend Configuartions" key="2">
          <div>{JSON.stringify(g6Cfg?.cfg)}</div>
        </Collapse.Panel>
        <Collapse.Panel header="Parsed Nodes and Edges" key="3">
          <div>
            {g6Cfg?.data?.nodes?.length > 0 && (
              <Table
                size="small"
                style={{ marginLeft: 10, marginRight: 10 }}
                dataSource={g6Cfg.data.nodes}
                columns={nodeColumns}
              ></Table>
            )}
            {g6Cfg?.data?.edges?.length > 0 && (
              <Table
                size="small"
                style={{ marginLeft: 10, marginRight: 10 }}
                dataSource={g6Cfg.data.edges}
                columns={linkColumns}
              ></Table>
            )}
          </div>
        </Collapse.Panel>
      </Collapse>
    </div>
  );
};
