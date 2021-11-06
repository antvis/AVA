import { Advisor } from '@antv/chart-advisor';
import { specToG6Plot } from '@antv/antv-spec';

// Prepare tabular data that describe relations: each row of data represents an edge
fetch('https://gw.alipayobjects.com/os/antfincdn/h7Bil5Cia/ava-eurocredit-data.json')
  .then((res) => res.json())
  .then((data) => {
    // specify which fields are used for source and target
    const extra = {
      sourceKey: 'Creditor',
      targetKey: 'Debtor',
    };

    // Initialize an advisor and pass the data to its advise function
    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({ data, options: { extra } });

    // The advices are returns in order from largest score to smallest score, you can choose the best advice to generate visualization
    const bestAdvice = advices[0];
    if (bestAdvice) {
      const { spec } = bestAdvice;
      const container = document.getElementById('container');
      specToG6Plot(spec, container);
    }
  });
