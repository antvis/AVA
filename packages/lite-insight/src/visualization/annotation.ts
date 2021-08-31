import { PatternInfo, PointPatternInfo, InsightInfo, TrendInfo } from '../interface';
import { dataFormat } from './util';

const COLOR: Record<string, string> = {
  highlight: '#E09322',
  outlier: '#CB5140',
  font: '#2C3542',
};

const TEXT_STYLE = {
  textAlign: 'center',
  fill: COLOR.font,
  opacity: 0.65,
};
const BOLD = 500;

interface Text {
  content: number | string;
  style?: Record<string, number | string>;
}

const annotationText = (
  texts: Text[],
  position: [number | string, number | string],
  offsetY: number = 0
) => {
  return texts.map((text, i) => ({
    type: 'text',
    content: dataFormat(text.content),
    position,
    offsetY: offsetY + i * 15,
    style: {
      ...TEXT_STYLE,
      ...text.style
    }
  }));
};

const generateAnnotationConfigItem = (pattern: PatternInfo, insightInfo: InsightInfo) => {
  const { breakdowns, measures, data } = insightInfo;
  if (['change_point', 'time_series_outlier'].includes(pattern.type)) {
    const patternInfo = pattern as PointPatternInfo;
    const { index } = patternInfo;
    const color = pattern.type === 'time_series_outlier' ? COLOR.outlier : COLOR.highlight;
    const xValue = data[index][breakdowns[0]];
    const yValue = data[index][measures[0].field];

    return [
      {
        type: 'dataMarker',
        position: [xValue, yValue],
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
      },
      ...annotationText([{
        content: xValue
      }, {
        content: yValue,
        style: {
          fontWeight: BOLD,
        }
      }], [xValue, yValue], -42),
    ];
  }
  if (pattern.type === 'category_outlier') {
    const patternInfo = pattern as PointPatternInfo;
    const { index } = patternInfo;
    const xValue = data[index][breakdowns[0]];
    const yValue = data[index][measures[0].field];
    return [
      {
        type: 'regionFilter',
        start: (xScale: any) => {
          const ratio = xScale.ticks ? 1 / xScale.ticks.length : 1;
          const x = xScale.scale(xValue) - ratio / 2;
          return [`${x * 100}%`, '0%'];
        },
        end: (xScale: any) => {
          const ratio = xScale.ticks ? 1 / xScale.ticks.length : 1;
          const x = xScale.scale(xValue) + ratio / 2;
          return [`${x * 100}%`, '100%'];
        },
        color: COLOR.outlier,
      },
      ...annotationText([{
        content: xValue
      }, {
        content: yValue,
        style: {
          fontWeight: BOLD,
        }
      }], [xValue, yValue], -22),
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
          lineDash: [2, 2],
          stroke: COLOR.highlight,
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
