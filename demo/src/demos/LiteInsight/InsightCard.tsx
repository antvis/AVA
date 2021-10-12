import React from 'react';
import { List } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  BoxPlotOutlined,
  StockOutlined,
  DotChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { InsightInfo } from '../../../../packages/lite-insight/src';
import { PlotRender } from './Plot';

interface InsightCardProps {
  insight: InsightInfo;
}

const getInsightIcon = (insightText: string) => {
  if (insightText.indexOf('increasing') !== -1) return <RiseOutlined style={{ fontSize: 24 }} />;
  if (insightText.indexOf('decreasing') !== -1) return <FallOutlined style={{ fontSize: 24 }} />;
  if (insightText.indexOf('outlier') !== -1) return <BoxPlotOutlined style={{ fontSize: 24 }} />;
  if (insightText.indexOf('change') !== -1) return <StockOutlined style={{ fontSize: 24 }} />;
  if (insightText.indexOf('majority') !== -1) return <PieChartOutlined style={{ fontSize: 24 }} />;
  if (insightText.indexOf('variance') !== -1) return <BarChartOutlined style={{ fontSize: 24 }} />;
  return <DotChartOutlined style={{ fontSize: 24 }} />;
};

const InsightCard = (props: InsightCardProps) => {
  const { insight } = props;

  const { visualizationSchemas, data } = insight;
  if (!visualizationSchemas) return null;

  const { chartType, chartSchema, caption, insightSummary } = visualizationSchemas[0];

  return (
    <div style={{ padding: 16, display: 'flex', boxShadow: '0px 1px 2px -1px #d9d9d9' }}>
      <div style={{ flex: 'none' }}>
        <PlotRender chartType={chartType} data={data} schema={chartSchema} caption={caption} />
      </div>
      <div style={{ flex: 1, borderLeft: '2px solid #bfbfbf', paddingLeft: 20 }}>
        <List
          itemLayout="horizontal"
          dataSource={insightSummary}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta avatar={getInsightIcon(item)} description={item} />
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default React.memo(InsightCard);
