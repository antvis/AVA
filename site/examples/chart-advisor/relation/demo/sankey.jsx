import { Advisor } from '@antv/chart-advisor';
import G6 from '@antv/g6';
import { specToG6Config } from '@antv/antv-spec';

const myAdvisor = new Advisor(); // Initialize an advisor
// Prepare data to be visualized
fetch('https://gw.alipayobjects.com/os/antfincdn/I6yCahSrA/ava-sankey-demo.json')
  .then((res) => res.json())
  .then((data) => {
    // specify which fields are used as declaring children
    const extra = {
      childrenKey: 'to',
    };
    // Get the recommended configurations and combine it with your own preferences to customize your visualization
    const advices = myAdvisor.advise({ data, options: { extra } });
    const bestAdvice = advices[0];
    if (bestAdvice) {
      const { spec } = bestAdvice;
      // customized configurations by modify recommended spec
      spec.layer[0].nodes.mark = 'rect';
      spec.layer[0].links.mark = 'cubic-vertical';
      const g6Cfg = specToG6Config(spec); // the recommended configurations
      // customized configurations by modify render configurations
      const myCfg = {
        layout: {
          type: 'dagre',
          rankdir: 'LR',
          nodesep: 20,
          ranksep: 40,
        },
      };
      const graph = new G6.Graph({
        container: 'container',
        ...g6Cfg.cfg,
        ...myCfg,
      });
      graph.data(g6Cfg.data);
      graph.render();
    }
  });
