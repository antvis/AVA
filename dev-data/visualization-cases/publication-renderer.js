// Extend these publication figures without changing GPT-Vis or AVA's built-in styles.
(() => {
  const create = (options) => {
    let chart;
    return {
      render(config) {
        chart?.destroy();
        chart = new G2.Chart({ container: options.container, autoFit: true });
        const density = config.type === 'area';
        const groups = [...new Set(config.data.map((row) => row.group))];
        const palette = config.style.palette;
        const axis = (title) => ({
          title, titleFontFamily: 'Alibaba Sans, AVA Han, sans-serif',
          titleFontSize: 14, titleFontWeight: 400, titleFill: '#64728a',
          labelFontFamily: 'Alibaba Sans, AVA Han, sans-serif',
          labelFontSize: 14, labelFontWeight: 400, labelFill: '#64728a', line: true, lineStroke: '#aebbd0',
          gridStroke: '#e2e8f2', gridLineDash: [3, 4], tick: false,
        });
        const children = density
          ? [
              ...groups.map((group, i) => ({
                type: 'area', data: config.data.filter((row) => row.group === group),
                style: { fill: i === 0
                  ? 'linear-gradient(-90deg, rgba(99,112,254,0.015) 0%, rgba(99,112,254,0.34) 100%)'
                  : 'linear-gradient(-90deg, rgba(19,172,157,0.015) 0%, rgba(19,172,157,0.34) 100%)' },
                tooltip: false, animate: false,
              })),
              { type: 'line', style: { lineWidth: 3, lineJoin: 'round' }, animate: false },
            ]
          : [{ type: 'point', encode: { shape: 'point', size: 6.5 },
               style: { fillOpacity: 0.9, stroke: '#fff', lineWidth: 1.2 }, animate: false }];
        chart.options({
          type: 'view', data: config.data,
          encode: { x: density ? 'time' : 'x', y: density ? 'value' : 'y', color: 'group' },
          scale: { color: { domain: groups, range: palette },
            x: density ? { type: 'linear', domain: [0, 1800], tickCount: 5 } : { nice: true, tickCount: 5 },
            y: density ? { domain: [0, 2.5], tickCount: 6 } : { domainMin: 0, nice: true, tickCount: 5 } },
          axis: { x: { ...axis(config.axisXTitle), grid: false, titleSpacing: 18 },
                  y: { ...axis(config.axisYTitle), grid: true, titleSpacing: 20 } },
          legend: { color: { position: 'top', title: false, itemLabelFontFamily: 'Alibaba Sans, AVA Han, sans-serif',
            itemLabelFontSize: 14, itemLabelFontWeight: 400, itemSpacing: 24 } },
          children, animate: false,
          theme: { type: 'light', fontFamily: 'Alibaba Sans, AVA Han, sans-serif' },
        });
        window.chartReady = chart.render();
      },
      destroy() { chart?.destroy(); },
    };
  };
  GPTVis.GPTVis.chartRegistry.area = create;
  GPTVis.GPTVis.chartRegistry.scatter = create;
})();
