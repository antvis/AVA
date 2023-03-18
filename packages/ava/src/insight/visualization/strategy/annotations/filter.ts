export const filterStrategy = () => {
    // category outlier
    const { x, y } = pattern;
    const filteredPoint = [
        {
          type: 'regionFilter',
          start: (xScale: any) => {
            const ratio = xScale.ticks ? 1 / xScale.ticks.length : 1;
            const xValue = xScale.scale(x) - ratio / 2;
            return [`${xValue * 100}%`, '0%'];
          },
          end: (xScale: any) => {
            const ratio = xScale.ticks ? 1 / xScale.ticks.length : 1;
            const xValue = xScale.scale(x) + ratio / 2;
            return [`${xValue * 100}%`, '100%'];
          },
          color: COLOR.outlier,
        },
        ...annotationText(
          [
            {
              content: x,
            },
            {
              content: y,
              style: {
                fontWeight: BOLD,
              },
            },
          ],
          [x, y],
          -22
        ),
      ];
  
}

/** lowlight information that does not require attention */
function lowlight(pattern: HomogeneousPatternInfo, colorField: string) {
  const { type, insightType, commonSet, exceptions = [] } = pattern;
  const chartType = ChartTypeMap[insightType];
  let highlightSet: string[] = [];
  if (type === 'commonness') {
    highlightSet = commonSet;
  } else if (type === 'exception') {
    highlightSet = exceptions;
  }
  const opacity = (value: string) => (highlightSet.includes(value) ? 1 : 0.2);
  if (chartType === 'line_chart') {
    return {
      lineStyle: (data) => {
        return {
          opacity: opacity(data[colorField]),
        };
      },
    };
  }
  if (chartType === 'column_chart') {
    return {
      columnStyle: (data) => {
        return {
          fillOpacity: opacity(data[colorField]),
        };
      },
    };
  }
  return {};
}
