export const lineMarkerStrategy = () => {
  // trend pattern 
  const {
    regression: { points },
  } = pattern;
  return [
    {
      type: 'line',
      start: ['min', points[0]],
      end: ['max', points[points.length - 1]],
      style: {
        lineDash: [2, 2],
        stroke: COLOR.highlight,
      },
    },
  ];

  // low variance pattern
  const { mean } = pattern;
  const lowVarianceLine = [
      {
        type: 'line',
        start: ['min', mean],
        end: ['max', mean],
        style: {
          lineDash: [2, 2],
          stroke: COLOR.highlight,
        },
      },
    ];
}
