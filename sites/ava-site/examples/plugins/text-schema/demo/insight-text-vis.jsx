import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import insertCss from 'insert-css';
import { Spin, Switch, Form, Row, Col } from 'antd';
import { getDataInsights } from '@antv/lite-insight';
import { PlotCard } from 'antv-site-demo-rc';

insertCss(`
.ntv-metric-name {
  font-weight: bold;
}

.ntv-metric-value {
  color: #2797fe;
}

.ntv-trend-desc,.ntv-dim-value {
  color: #000;
  background-color: #e9e9e9;
}
`);

const Paragraph = ({ phrases }) => {
  return (
    <p className="ntv-p">
      {Array.isArray(phrases)
        ? phrases.map((phrase) => {
            if (phrase.type === 'text') return phrase.value;
            if (phrase.type === 'entity')
              return (
                <span className={`ntv-value ntv-${phrase.metadata.entityType.replace('_', '-')}`}>{phrase.value}</span>
              );
            return null;
          })
        : phrases}
    </p>
  );
};

const App = () => {
  const [result, setResult] = useState({});
  const [loading, setLoading] = useState(true);
  const [summaryType, setSummaryType] = useState('schema');

  const getInsights = async () => {
    fetch('https://cdn.jsdelivr.net/npm/vega-datasets@2.2.0/data/gapminder.json')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const insightResult = getDataInsights(data, {
            limit: 10,
            measures: [
              { field: 'life_expect', method: 'MEAN' },
              { field: 'pop', method: 'SUM' },
              { field: 'fertility', method: 'MEAN' },
            ],
            // 配置文本插件
            // config text plugin
            visualization: { summaryType },
            insightTypes: ['category_outlier'],
          });
          setResult(insightResult);
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    getInsights();
  }, [summaryType]);

  return (
    <>
      <Row style={{ borderBottom: '1px solid #e9e9e9' }} justify="space-between">
        <Col>Insight list</Col>
        <Col>
          <Form.Item label="Use text plugin（是否开启文本插件）">
            <Switch
              checked={summaryType === 'schema'}
              onChange={(checked) => {
                setSummaryType(checked ? 'schema' : 'text');
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Spin spinning={loading} style={{ marginTop: 80 }}>
        <div style={{ width: '100%' }}>
          {result.insights &&
            result.insights.map((item, index) => (
              <div key={index}>
                <PlotCard
                  chartType={item.visualizationSchemas[0].chartType}
                  data={item.data}
                  schema={item.visualizationSchemas[0].chartSchema}
                  caption={item.visualizationSchemas[0].caption}
                />
                {item.visualizationSchemas[0].insightSummaries.map((phrases, index) => (
                  <Paragraph phrases={phrases} key={index} />
                ))}
              </div>
            ))}
        </div>
      </Spin>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
