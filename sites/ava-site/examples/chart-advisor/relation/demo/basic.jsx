import React, { useState, useEffect } from 'react';
import { Advisor } from '@antv/chart-advisor';
import ReactDOM from 'react-dom';
import { specToG6Plot } from '@antv/antv-spec';

const GraphPanel = () => {
  const [selectedAdviceId, setAdviceId] = useState(-1);
  const [data, setData] = useState(null);
  const [advices, setAdvices] = useState([]);
  const myAdvisor = new Advisor(); // Initialize an advisor

  useEffect(() => {
    // Prepare nodes-links data to be visualize
    fetch('https://gw.alipayobjects.com/os/antfincdn/WHs4so6mX/ava-basic-graph-demo.json')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      });
  }, []);

  useEffect(() => {
    // Pass the data to advise function. The advices are returns in order from largest score to smallest score. You could select an advice to visualize data
    if (data) {
      const advices = myAdvisor.advise({ data });
      setAdvices(advices);
      setAdviceId(0);
    }
  }, [data]);

  useEffect(() => {
    // use antvspec-to-g6 adaptor to convert the advice to g6 configuration and render the plot
    const advice = advices[selectedAdviceId];
    if (advice) {
      specToG6Plot(advice.spec, document.getElementById('graphCanvas'));
    }
  }, [selectedAdviceId]);

  const handleAdviceSelect = (e) => {
    setAdviceId(e.target.value);
  };

  return (
    <div className="graph-panel-container">
      <select onChange={handleAdviceSelect} style={{ width: 160 }}>
        {advices.map((advice, index) => {
          return (
            <option value={index} key={index}>
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
