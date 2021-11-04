import React, { useState, useEffect } from 'react';
import { Advisor } from '@antv/chart-advisor';
import ReactDOM from 'react-dom';
// import { specToG6Config, specToG6Plot } from '@antv/antv-spec';

const GraphPanel = () => {
  // Prepare nodes-links data to be visualized
  const data = {
    nodes: [
      {
        id: '0',
        label: 'employee-0',
        dataType: 'employee',
      },
      {
        id: '1',
        label: 'employee-1',
        dataType: 'employee',
      },
      {
        id: '2',
        label: 'employee-2',
        dataType: 'employee',
      },
      {
        id: '3',
        label: 'employee-3',
        dataType: 'employee',
      },
      {
        id: '4',
        label: 'employee-4',
        dataType: 'employee',
      },
      {
        id: '5',
        label: 'employee-5',
        dataType: 'employee',
      },
      {
        id: '6',
        label: 'employee-6',
        dataType: 'employee',
      },
      {
        id: '7',
        label: 'employee-7',
        dataType: 'employee',
      },
      {
        id: '8',
        label: 'employee-8',
        dataType: 'employee',
      },
      {
        id: '9',
        label: 'employee-9',
        dataType: 'employee',
      },
      {
        id: '10',
        label: 'employee-10',
        dataType: 'employee',
      },
      {
        id: '11',
        label: 'employee-11',
        dataType: 'employee',
      },
      {
        id: '12',
        label: 'employee-12',
        dataType: 'employee',
      },
      {
        id: '13',
        label: 'employee-13',
        dataType: 'employee',
      },
      {
        id: '14',
        label: 'employee-14',
        dataType: 'employee',
      },
      {
        id: '15',
        label: 'employee-15',
        dataType: 'employee',
      },
      {
        id: '16',
        label: 'employee-16',
        dataType: 'employee',
      },
      {
        id: '17',
        label: 'company-0',
        dataType: 'company',
      },
      {
        id: '23',
        label: 'company-1',
        dataType: 'company',
      },
      {
        id: '24',
        label: 'company-2',
        dataType: 'company',
      },
      {
        id: '25',
        label: 'company-3',
        dataType: 'company',
      },
      {
        id: '26',
        label: 'company-4',
        dataType: 'company',
      },
      {
        id: '27',
        label: 'company-5',
        dataType: 'company',
      },
      {
        id: '28',
        label: 'company-6',
        dataType: 'company',
      },
      {
        id: '29',
        label: 'company-7',
        dataType: 'company',
      },
      {
        id: '30',
        label: 'company-8',
        dataType: 'company',
      },
      {
        id: '31',
        label: 'company-9',
        dataType: 'company',
      },
    ],
    edges: [
      { source: '0', target: '1' },
      { source: '0', target: '2' },
      { source: '0', target: '3' },
      { source: '0', target: '4' },
      { source: '0', target: '5' },
      { source: '0', target: '6' },
      { source: '1', target: '2' },
      { source: '1', target: '3' },
      { source: '1', target: '4' },
      { source: '1', target: '5' },
      { source: '1', target: '6' },
      { source: '2', target: '3' },
      { source: '2', target: '4' },
      { source: '2', target: '5' },
      { source: '2', target: '6' },

      { source: '7', target: '8' },
      { source: '8', target: '9' },
      { source: '9', target: '10' },

      { source: '11', target: '12' },
      { source: '12', target: '13' },
      { source: '13', target: '14' },
      { source: '14', target: '15' },
      { source: '15', target: '16' },
      { source: '11', target: '14' },

      { source: '31', target: '11' },
      { source: '24', target: '4' },
      { source: '23', target: '7' },
    ],
  };

  // Initialize an advisor and pass the data to its advise function
  const myAdvisor = new Advisor();
  const advices = myAdvisor.advise({ data });

  // The advices are returns in order from largest score to smallest score, creat a selector to show each advice and its score. You could select an advice to visualize data
  const [advice, setAdvice] = useState(advices?.[0]);

  // change advice
  const handleAdviceSelect = (e) => {
    const advice = advices[e.target.value];
    setAdvice(advice);
  };

  useEffect(() => {
    // use antvspec-to-g6 adaptor to convert the advice to g6 configuration and render the plot
    window.g6Utils.specToG6Plot(advice.spec, document.getElementById('graphCanvas'));
  }, [advice]);

  return (
    <div className="graph-panel-container">
      <select onChange={handleAdviceSelect} style={{ width: 160 }}>
        {advices.map((advice, index) => {
          return (
            <option value={index} key={index}>
              {' '}
              {`Advice${index}: ${advice.score}`}
            </option>
          );
        })}
      </select>
      <div id="graphCanvas"></div>
    </div>
  );
};

ReactDOM.render(<GraphPanel />, document.getElementById('container'));
