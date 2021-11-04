import G6 from '@antv/g6';

export function g6Render(g6Cfg: any, container: HTMLElement) {
  if (g6Cfg?.data && g6Cfg?.cfg) {
    const graph = new G6.Graph({
      container,
      ...g6Cfg.cfg,
    });
    graph.data(g6Cfg.data);
    graph.render();
    return graph;
  }

  return null;
}
