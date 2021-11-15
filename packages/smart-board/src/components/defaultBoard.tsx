import React, { useState, useEffect } from 'react';
import { Chart, SmartBoardDashboardProps } from '../interfaces';
import { SmartBoardChartView as ChartView } from './defaultChartView';

export const SmartBoardDashboard = (props: SmartBoardDashboardProps) => {
  const { chartList, chartGraph, chartOrder, chartCluster } = props;
  const interactionMode = props.interactionMode ?? 'defaultMode';
  const hasInsight = !!props.hasInsight;

  // when the interactionMode is connection mode and a chart was selected, filter and resort charts
  const sortedChartList = new Array<Chart>(chartList.length);
  chartGraph.nodes.forEach((d) => {
    sortedChartList[chartOrder[d.id]] = d;
  });

  const [connectionID, changeConnectionID] = useState<string>('');
  useEffect(() => {
    return () => {};
  }, [connectionID]);

  let curChartList = sortedChartList;
  const chartID = sortedChartList.map((d) => d.id);
  if (chartID.includes(connectionID) && interactionMode === 'connectionMode') {
    const connectionLinks = chartGraph.links.filter(
      (d: { source: string; target: string }) => d.source === connectionID || d.target === connectionID
    );

    const connectionNodes = connectionLinks.map((d) => (d.source === connectionID ? d.target : d.source));
    connectionLinks.forEach((d, i) => {
      const id = connectionNodes[i];
      const chart = sortedChartList[chartID.indexOf(id)];
      chart.description = d.description;
    });

    connectionNodes.unshift(connectionID);
    const filteredChartList: Chart[] = [];

    connectionNodes.forEach((d) => {
      const chart = sortedChartList[chartID.indexOf(d)];
      filteredChartList.push(chart);
    });
    curChartList = filteredChartList;
  }

  const quitResort = () => {
    curChartList = sortedChartList;
    changeConnectionID('');
  };

  return (
    <div id="dashboard">
      {curChartList.map((chart) => {
        const clusterIndex = chartCluster[chart.id];
        return (
          <ChartView
            key={chart.id}
            chartID={chart.id}
            chartInfo={chart}
            interactionMode={interactionMode}
            hasInsight={hasInsight}
            clusterID={`cluster_${clusterIndex}`}
            hasLocked={!!connectionID} // if there exist connectionID, it means the dashboard comes into connection view
            changeConnectionID={changeConnectionID}
            quitResort={quitResort}
          />
        );
      })}
    </div>
  );
};
