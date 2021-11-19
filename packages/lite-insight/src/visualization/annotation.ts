import { PatternInfo, PointPatternInfo, HomogeneousPatternInfo } from '../interface';
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

const annotationText = (texts: Text[], position: [number | string, number | string], offsetY: number = 0) => {
  return texts.map((text, i) => ({
    type: 'text',
    content: dataFormat(text.content),
    position,
    offsetY: offsetY + i * 15,
    style: {
      ...TEXT_STYLE,
      ...text.style,
    },
  }));
};

const generateAnnotationConfigItem = (pattern: PatternInfo) => {
  if (pattern.type === 'change_point' || pattern.type === 'time_series_outlier') {
    const { x, y } = pattern;
    const color = pattern.type === 'time_series_outlier' ? COLOR.outlier : COLOR.highlight;

    return [
      {
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
        -42
      ),
    ];
  }
  if (pattern.type === 'category_outlier') {
    const { x, y } = pattern;
    return [
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
  if (pattern.type === 'trend') {
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
  }
  if (pattern.type === 'low_variance') {
    const { mean } = pattern;
    return [
      {
        type: 'line',
        start: ['min', mean],
        end: ['max', mean],
        style: {
          lineDash: [2, 2],
          stroke: COLOR.highlight,
        },
      },
      {
        type: 'text',
        position: ['min', mean],
        content: 'mean',
        offsetX: -28,
        offsetY: -4,
        style: {
          textBaseline: 'bottom',
          fill: COLOR.highlight,
        },
      },
    ];
  }
  return [];
};

export const generateInsightAnnotationConfig = (patterns: PatternInfo[]) => {
  const annotations = [];
  patterns.forEach((pattern) => {
    const configItems = generateAnnotationConfigItem(pattern);
    annotations.push(...configItems);
  });
  return annotations;
};

export const generateHomogeneousInsightAnnotationConfig = (pattern: HomogeneousPatternInfo) => {
  const annotations = [];
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
};
