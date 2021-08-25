import { PatternInfo, PointPatternInfo, InsightInfo, TrendInfo } from '../interface';
import { insightNameMap } from './description';

const generateAnnotationConfigItem = (pattern: PatternInfo, insightInfo: InsightInfo) => {
  const { breakdowns, measures, data } = insightInfo;
  if (['category_outlier', 'change_point', 'time_series_outlier'].includes(pattern.type)) {
    const patternInfo = pattern as PointPatternInfo;
    const { index } = patternInfo;
    return [
      {
        type: 'dataMarker',
        position: [data[index][breakdowns[0]], data[index][measures[0].field]],
        point: {
          style: {
            fill: '#f5222d',
            stroke: '#f5222d',
          },
        },
        text: {
          content: insightNameMap[pattern.type],
          style: {
            textAlign: 'left',
          },
        },
        line: {
          length: 20,
        },
        autoAdjust: false,
      },
    ];
  }
  if (pattern.type === 'trend') {
    const patternInfo = pattern as TrendInfo;
    const {
      regression: { points },
    } = patternInfo;
    return [
      {
        type: 'line',
        start: ['min', points[0]],
        end: ['max', points[points.length - 1]],
        style: {
          lineDash: [4, 4],
          stroke: 'orange',
        },
        text: {
          content: 'trend',
          position: 'right',
          offsetY: 18,
          style: {
            textAlign: 'right',
          },
        },
      },
    ];
  }
  return [];
};

export const generateInsightAnnotationConfig = (patterns: PatternInfo[], insight: InsightInfo) => {
  const annotations: any[] = [];
  patterns.forEach((pattern) => {
    const configItems = generateAnnotationConfigItem(pattern, insight);
    annotations.push(...configItems);
  });
  return annotations;
};
