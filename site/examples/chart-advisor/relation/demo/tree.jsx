import { Advisor } from '@antv/chart-advisor';
import { specToG6Plot } from '@antv/antv-spec';

// Prepare hierachical data: some entities have a parent-child relationship with each other
fetch('https://gw.alipayobjects.com/os/antfincdn/0cfrQND8L/ava-knowledgetree-demo.json')
  .then((res) => res.json())
  .then((data) => {
    // Initialize an advisor and pass the data to its advise function
    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data });

    // The advices are returns in order from largest score to smallest score, you can choose the best advice to generate visualization
    const bestAdvice = advices[0];
    if (bestAdvice) {
      const { spec } = bestAdvice;
      const container = document.getElementById('container');
      specToG6Plot(spec, container);
    }
  });
