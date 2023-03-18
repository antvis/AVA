export function generateInsightAnnotationConfigs(patterns: PatternInfo[]) {
  const annotations: any[] = [];
  const others: { [key: string]: any } = {};
  patterns.forEach((pattern) => {
    const configItems = generateAnnotationConfigItem(pattern);
    annotations.push(...configItems);
    if (pattern.type === 'correlation') {
      others.pointStyle = {
        lineWidth: 1,
        fill: '#5B8FF9',
      };
      others.regressionLine = {
        type: 'linear',
        style: {
          stroke: 'red',
        },
      };
    }
  });
  return { ...others, annotations };
}


export function getInsightVisualizationSchema(
  insight: InsightInfo<PatternInfo>,
  visualizationOptions: InsightOptions['visualization']
): VisualizationSchema[] {
  const { dimensions, patterns, measures } = insight;

  const schemas: VisualizationSchema[] = [];
  const summaryType = get(visualizationOptions, 'summaryType', 'text') as VisualizationOptions['summaryType'];

  const patternGroups = groupBy(patterns, (pattern) => ChartTypeMap[pattern.type] as ChartType);

  Object.entries(patternGroups).forEach(([chartType, patternGroup]: [string, PatternInfo[]]) => {
    const narrative = new InsightNarrativeGenerator(patterns, insight);

    const plotSchema = {
      [chartType === 'pie_chart' ? 'colorField' : 'xField']:
        chartType === 'scatter_plot' ? measures[1].fieldName : dimensions[0],
      [chartType === 'pie_chart' ? 'angleField' : 'yField']: measures[0].fieldName,
    };
    const annotationConfigs = generateInsightAnnotationConfigs(patternGroup);

    const chartSchema = {
      ...plotSchema,
      ...annotationConfigs,
    };
    schemas.push({
      chartType: chartType as ChartType,
      chartSchema,
      // @ts-ignore TODO @yuxi modify ntv generator and put caption into narrativeSchema
      narrativeSchema:
        summaryType === 'schema'
          ? narrative.summaries?.map((i) => i.getSchema())
          : narrative.summaries?.map((i) => i.getContent()),
    });
  });

  return schemas;
}
