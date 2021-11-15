import React, { useState, useEffect } from 'react';
import { Tag, Tooltip } from 'antd';
import { LockOutlined, UnlockOutlined, MonitorOutlined, FundViewOutlined } from '@ant-design/icons';
import { statistics } from '@antv/data-wizard';
import { g2plotRender } from '@antv/antv-spec';
import { smartBoardConfig } from '../utils/smartBoardConfig';
import { SmartBoardChartViewProps, ConfigObj } from '../interfaces';

export const SmartBoardChartView = (props: SmartBoardChartViewProps) => {
  const { chartID, chartInfo, clusterID, interactionMode, hasLocked, hasInsight, changeConnectionID, quitResort } =
    props;
  const [curChartConfig, setChartConfig] = useState<ConfigObj>();
  let plot: any;

  useEffect(() => {
    if (chartInfo.data) {
      const chartConfig = smartBoardConfig(chartInfo, chartInfo.data);
      const { xField, yField, colorField, angleField, seriesField } = chartConfig.config;

      let aggregatedData = chartInfo.data;
      if ((xField || colorField) && (yField || angleField)) {
        aggregatedData = statistics.aggregate(
          chartInfo.data,
          xField || colorField || '',
          yField || angleField || '',
          'SUM',
          seriesField
        );
      }

      setChartConfig(chartConfig);
      const g2plotCfg = {
        chartType: chartConfig.type,
        config: {
          data: aggregatedData,
          ...(chartInfo.chartSchema ?? chartConfig.config),
        },
      };
      plot = g2plotRender(g2plotCfg, document.getElementById(`chart_container_${chartID}`));
    } else if (chartInfo.dataUrl) {
      fetch(chartInfo.dataUrl)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          Object.assign(chartInfo, { data });
          const chartConfig = smartBoardConfig(chartInfo, data);
          const { xField, yField, colorField, angleField, seriesField } = chartConfig.config;

          let aggregatedData = data;
          if ((xField || colorField) && (yField || angleField)) {
            aggregatedData = statistics.aggregate(
              chartInfo.data,
              xField || colorField || '',
              yField || angleField || '',
              'SUM',
              seriesField
            );
          }

          setChartConfig(chartConfig);
          const g2plotCfg = {
            chartType: chartConfig.type,
            config: {
              data: aggregatedData,
              ...(chartInfo.chartSchema ?? chartConfig.config),
            },
          };
          plot = g2plotRender(g2plotCfg, document.getElementById(`chart_container_${chartID}`));
        });
    }
    return function cleanup() {
      if (plot) {
        plot.destroy();
      }
    };
  }, [chartID, chartInfo, hasLocked]);

  const [chartClassName, setChartClassName] = useState('chart-view');
  useEffect(() => {
    setChartClassName(`chart_view ${interactionMode === 'clusterMode' ? clusterID : ''}`);
  }, [interactionMode]);

  const [isLocked, toggleLocked] = useState(false);
  const handleResort = () => {
    changeConnectionID(chartID);
    toggleLocked(!isLocked);
  };

  const cancelResort = () => {
    quitResort();
    toggleLocked(!isLocked);
  };

  const lockIcon = isLocked ? (
    <Tooltip title={'Cancel Connection'}>
      <LockOutlined
        className="resort_icon"
        style={{ color: 'red', visibility: interactionMode === 'connectionMode' ? 'visible' : 'hidden' }}
        onClick={cancelResort}
      />
    </Tooltip>
  ) : (
    <Tooltip title={'Show Connection'}>
      <UnlockOutlined
        className="resort_icon"
        style={{ visibility: interactionMode === 'connectionMode' && !hasLocked ? 'visible' : 'hidden' }}
        onClick={handleResort}
      />
    </Tooltip>
  );

  const config = curChartConfig?.config;
  const dimension =
    curChartConfig?.type !== 'Pie' ? `${config?.xField} ${config?.seriesField || ''}` : config?.colorField;
  const measure = curChartConfig?.type !== 'Pie' ? config?.yField : config?.angleField;
  const score = curChartConfig?.score;
  const chartDescription = curChartConfig?.description;
  const { description, insightType } = chartInfo;
  type linkDict = {
    [key: string]: string;
  };
  const linkTag: linkDict = {
    SAME_DIMENSION: 'SD',
    SAME_MEASURE: 'SM',
    SAME_INSIGHT_TYPE: 'SI',
  } as const;

  return (
    <div className={chartClassName} id={`chart_view_${chartID}`}>
      <div className="title_view">
        <div className="title_info">
          {score && (
            <Tooltip title={`Score: ${score}`}>
              <Tag icon={<MonitorOutlined />} color="error">{`${Math.floor(score * 100) / 100}`}</Tag>
            </Tooltip>
          )}
          {dimension && (
            <Tooltip title={`Dimension: ${dimension}`}>
              <Tag color="processing">{`${dimension}`}</Tag>
            </Tooltip>
          )}
          {measure && (
            <Tooltip title={`Measure: ${measure}`}>
              <Tag color="processing">{`${measure}`}</Tag>
            </Tooltip>
          )}
          {hasInsight && (
            <Tooltip title={`Insight: ${chartDescription}`}>
              <Tag icon={<FundViewOutlined />} color="success">{`${insightType}`}</Tag>
            </Tooltip>
          )}
        </div>
        <div className="right_icons">{lockIcon}</div>
      </div>
      <div id={`chart_container_${chartID}`}></div>
      {hasLocked &&
        description &&
        description.map((d: string) => {
          return (
            <Tooltip key={d} title={d}>
              <Tag>{linkTag[d]}</Tag>
            </Tooltip>
          );
        })}
    </div>
  );
};
