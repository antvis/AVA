import { Advisor } from '@antv/chart-advisor';
import G6 from '@antv/g6';
// Prepare data to be visualized
const data = [
  {
    label: 'A',
    id: 'A',
    to: [
      {
        id: 'C',
        size: 20,
      },
    ],
  },
  {
    label: 'B',
    id: 'B',
    to: [
      {
        id: 'C',
        size: 40,
      },
    ],
  },
  {
    label: 'C',
    id: 'C',
    to: [
      {
        id: 'D',
        size: 30,
      },
      {
        id: 'E',
        size: 30,
      },
    ],
  },
  {
    label: 'D',
    id: 'D',
    to: [
      {
        id: 'F',
        size: 10,
      },
      {
        id: 'G',
        size: 20,
      },
    ],
  },
  {
    label: 'E',
    id: 'E',
    to: [
      {
        id: 'F',
        size: 20,
      },
      {
        id: 'G',
        size: 10,
      },
    ],
  },
  {
    label: 'F',
    id: 'F',
  },
  {
    label: 'G',
    id: 'G',
  },
];

// specify which fields are used as declaring children
const extra = {
  childrenKey: 'to',
};

const myAdvisor = new Advisor();
const advices = myAdvisor.advise({ data, options: { extra } });

const bestAdvice = advices[0];
if (bestAdvice) {
  const { spec } = bestAdvice;
  // Get the recommended configurations and combine it with your own preferences to customize your visualization
  const g6Cfg = window.g6Utils.specToG6Config(spec); // the recommended configurations
  const myCfg = {
    layout: {
      type: 'dagre',
      rankdir: 'TB',
      nodesep: 50,
      ranksep: 100,
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
