import React, { useState, useEffect } from 'react';
import { SmartBoard } from '../../../../../packages/smart-board/src';
import { ChartListInfo, Chart } from '../../../../../packages/smart-board/src/interfaces';
import ChartView from './ChartView';

interface DashboardProps {
  chartList: ChartListInfo;
  interactionMode: string;
}

const Dashboard = (props: DashboardProps) => {
  const { chartList, interactionMode } = props;
  const smartBoard = new SmartBoard(chartList);
  const { chartGraph } = smartBoard;
  const chartOrder = smartBoard.chartOrder('byCluster');
  const chartCluster = smartBoard.chartCluster();
  // TODO: when the interactionMode is connection mode and a chart was selected, filter and resort charts
  const sortedChartList = new Array<Chart>(chartList.length);
  chartGraph.nodes.forEach((d) => {
    sortedChartList[chartOrder[d.id]] = d;
  });
  const [focusID, changeFocusID] = useState<string>('');
  useEffect(() => {
    return () => {};
  }, [focusID]);

  const [connectionID, changeConnectionID] = useState<string>('');
  useEffect(() => {
    return () => {};
  }, [connectionID]);

  let curChartList = sortedChartList;
  if (connectionID && interactionMode === 'connectionMode') {
    const connectionLinks = chartGraph.links.filter(
      (d: { source: string; target: string }) => d.source === connectionID || d.target === connectionID
    );
    const chartID = sortedChartList.map((d) => d.id);
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
            clusterID={`cluster_${clusterIndex}`}
            hasLocked={!!connectionID} // if there exist connectionID, it means the dashboard comes into connection view
            changeFocusID={changeFocusID}
            changeConnectionID={changeConnectionID}
            quitResort={quitResort}
          />
        );
      })}
    </div>
  );
};

export default Dashboard;
