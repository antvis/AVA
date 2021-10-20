import React, { useEffect, useState } from 'react';
import { Table, Select, Row, Col, Collapse } from 'antd';
import G6 from '@antv/g6';
import { Advisor } from '../../../../packages/chart-advisor/src';
import { ExampleDataset } from './SampleData';

const { Option } = Select;

export const GraphPlayground = () => {
  const defaultDataset = ExampleDataset[0];
  const [graphData, setGraphData] = useState(defaultDataset?.data);
  const [extra, setExtra] = useState();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [cfg, setCfgs] = useState({});
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

  /* eslint-disable no-underscore-dangle */
  const updateGraphStyle = (graph, cfg) => {
    const { nodeCfg } = cfg;
    const { color, size, label } = nodeCfg;
    const colorMap = {};
    color?.scale.domain.forEach((key, index) => {
      colorMap[key] = color?.scale.range[index];
    });

    graph.getNodes().forEach((node) => {
      console.log(node);
      const sizeDomainVal = node._cfg.model[size?.key];
      node.update({
        style: {
          fill: colorMap[node._cfg.model[color?.key]],
        },
        label: node._cfg.model.label || node._cfg.model[label?.key],
        size: sizeDomainVal - size.scale.range.min,
      });
    });
  };

  useEffect(() => {
    // const parsedData = new GraphData(cloneDeep(graphData), extra).data;
    const { advices: cfg, data: parsedData } = myAdvisor.adviseForGraph({ data: graphData, options: extra });
    setCfgs(cfg);
    console.log('parsed data', parsedData);
    setNodes(parsedData.nodes);
    setEdges(parsedData.edges);
    const nodeColumns = Object.keys(parsedData.nodes[0]).map((key) => {
      return {
        title: key,
        dataIndex: key,
        key,
      };
    });
    const edgesColumns = Object.keys(parsedData.edges[0]).map((key) => {
      return {
        title: key,
        dataIndex: key,
        key,
      };
    });
    setNodeColumns(nodeColumns);
    setEdgeColumns(edgesColumns);
    const { layoutCfg } = cfg;
    if (!g6Graph) {
      const graph = new G6.Graph({
        container: ref.current,
        width: 800,
        height: 800,
        layout: layoutCfg,
        modes: { default: ['drag-canvas', 'zoom-canvas'] },
      });
      graph.data(parsedData);
      graph.render();
      updateGraphStyle(graph, cfg);
      setG6Graph(graph);
    } else {
      g6Graph.data(parsedData);
      g6Graph.render();
      updateGraphStyle(g6Graph, cfg);
    }
  }, [graphData]);

  return (
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
      <Row>
        <Col span={10}>
          <Collapse defaultActiveKey={['2']}>
            <Collapse.Panel header="Raw Data" key="1">
              <p>{JSON.stringify(graphData)}</p>
            </Collapse.Panel>

            <Collapse.Panel header="Parsed Nodes and Links" key="2">
              <div>
                {nodes?.length > 0 && (
                  <Table
                    size="small"
                    style={{ marginLeft: 10, marginRight: 10 }}
                    dataSource={nodes}
                    columns={nodeColumns}
                  ></Table>
                )}
                {edges?.length > 0 && (
                  <Table
                    size="small"
                    style={{ marginLeft: 10, marginRight: 10 }}
                    dataSource={edges}
                    columns={edgeColumns}
                  ></Table>
                )}
              </div>
            </Collapse.Panel>
            <Collapse.Panel header="Recommend Configuartions" key="3">
              <p>{JSON.stringify(cfg)}</p>
            </Collapse.Panel>
          </Collapse>
        </Col>
        <Col span={14}>
          <div className="graph-canvas" ref={ref}></div>
        </Col>
      </Row>
    </div>
  );
};
