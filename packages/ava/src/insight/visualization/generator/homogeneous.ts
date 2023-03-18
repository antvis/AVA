export function generateHomogeneousInsightAnnotationConfig(pattern: HomogeneousPatternInfo) {
  const annotations: any[] = [];
  const { insightType, childPatterns } = pattern;

  if (['change_point', 'time_series_outlier'].includes(insightType)) {
    const { x } = childPatterns[0] as PointPatternInfo;
    const text = insightType === 'change_point' ? 'Abrupt Change' : 'Outlier';
    const color = insightType === 'change_point' ? COLOR.highlight : COLOR.outlier;
    // draw line
    const line = {
      type: 'line',
      start: [x, 'min'],
      end: [x, 'max'],
      text: {
        content: text,
        position: 'left',
        offsetY: 15,
        offsetX: 5,
        rotate: 0,
        autoRotate: false,
        style: {
          textAlign: 'left',
        },
      },
    };
    annotations.push(line);
    // draw circle
    const circles = childPatterns.map((pattern) => {
      const { y } = pattern as PointPatternInfo;
      return {
        type: 'dataMarker',
        position: [x, y],
        point: {
          style: {
            fill: '#fff',
            stroke: color,
          },
        },
        line: {
          length: 20,
        },
        autoAdjust: false,
      };
    });
    annotations.push(...circles);
  }

  return annotations;
}

export function getHomogeneousInsightVisualizationSchema(
  insight: InsightInfo<HomogeneousPatternInfo>,
  visualizationOptions: InsightOptions['visualization']
): VisualizationSchema[] {
  const { dimensions, patterns, measures } = insight;

  const schemas: VisualizationSchema[] = [];
  const summaryType = get(visualizationOptions, 'summaryType', 'text') as VisualizationOptions['summaryType'];
  const { summary } = new HomogeneousNarrativeGenerator(insight.patterns, insight);

  patterns.forEach((pattern) => {
    const { insightType } = pattern;
    const chartType = ChartTypeMap[insightType];

    let plotSchema;
    if (measures.length > 1) {
      plotSchema = {
        xField: dimensions[0],
        yField: 'value',
        seriesField: 'measureName',
      };
    } else {
      plotSchema = {
        xField: dimensions[1],
        yField: measures[0].fieldName,
        seriesField: dimensions[0],
      };
    }

    const style = lowlight(pattern, plotSchema.seriesField);
    const annotationConfig = generateHomogeneousInsightAnnotationConfig(pattern);

    const chartSchema = {
      ...plotSchema,
      ...style,
      annotations: annotationConfig,
    };
    schemas.push({
      chartType,
      chartSchema,
      // @ts-ignore TODO @yuxi modify ntv generator and put caption into narrativeSchema
      narrativeSchema: summaryType === 'schema' ? [summary.getSchema()] : [summary.getContent()],
    });
  });

  return schemas;
}
