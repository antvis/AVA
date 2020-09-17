import { ChartID, LevelOfMeasurement as LOM } from '@antv/knowledge';
import * as DWAnalyzer from '@antv/dw-analyzer';
import { FieldInfo, Advice } from './interface';
import { EncodingType } from './vega-lite';

export function specMapping(chartType: ChartID, dataProps: FieldInfo[]): Advice['spec'] {
  switch (chartType) {
    case 'pie_chart':
      return pie_chart(dataProps);
    case 'donut_chart':
      return donut_chart(dataProps);
    case 'line_chart':
      return line_chart(dataProps);
    case 'step_line_chart':
      return step_line_chart(dataProps);
    case 'area_chart':
      return area_chart(dataProps);
    case 'bar_chart':
      return bar_chart(dataProps);
    case 'grouped_bar_chart':
      return grouped_bar_chart(dataProps);
    case 'stacked_bar_chart':
      return stacked_bar_chart(dataProps);
    // case 'percent_stacked_bar_chart':
    //   return percent_stacked_bar_chart(dataProps);
    case 'column_chart':
      return column_chart(dataProps);
    case 'grouped_column_chart':
      return grouped_column_chart(dataProps);
    case 'stacked_column_chart':
      return stacked_column_chart(dataProps);
    // https://github.com/vega/vega-lite/issues/3805
    // case 'radar_chart':
    //   return radar_chart(dataProps);
    case 'scatter_plot':
      return scatter_plot(dataProps);
    case 'bubble_chart':
      return bubble_chart(dataProps);
    case 'histogram':
      return histogram(dataProps);
    case 'heatmap':
      return heatmap(dataProps);
    default:
      return null;
  }
}

function hasSubset(array1: any[], array2: any[]): boolean {
  return array2.every((e) => array1.includes(e));
}

function intersects(array1: any[], array2: any[]): boolean {
  return array2.some((e) => array1.includes(e));
}

function compare(f1: FieldInfo, f2: FieldInfo): number {
  if (f1.distinct < f2.distinct) {
    return 1;
  } else if (f1.distinct > f2.distinct) {
    return -1;
  } else {
    return 0;
  }
}

function LOM2EncodingType(lom: LOM): EncodingType {
  switch (lom) {
    case 'Nominal':
      return 'nominal';
    case 'Ordinal':
      return 'ordinal';
    case 'Interval':
      return 'quantitative';
    case 'Time':
      return 'temporal';
    case 'Continuous':
      return 'quantitative';
    case 'Discrete':
      return 'nominal';
    default:
      return 'nominal';
  }
}

type ReturnField = FieldInfo | undefined;

/* pie_chart & donut_chart */

function splitAngleColor(dataProps: FieldInfo[]): [ReturnField, ReturnField] {
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const field4Angle = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4Color, field4Angle];
}

function pie_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const [field4Color, field4Angle] = splitAngleColor(dataProps);
  if (!field4Angle || !field4Color) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'arc' },
    encoding: {
      theta: { field: field4Angle.name, type: 'quantitative' },
      color: { field: field4Color.name, type: 'nominal' },
    },
  };

  return spec;
}

function donut_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const [field4Color, field4Angle] = splitAngleColor(dataProps);
  if (!field4Angle || !field4Color) return null;

  return {
    mark: { type: 'arc', innerRadius: 50 },
    encoding: {
      theta: { field: field4Angle.name, type: 'quantitative' },
      color: { field: field4Color.name, type: 'nominal' },
    },
  };
}

/* line_chart & step_line_chart */

function splitLineXY(dataProps: FieldInfo[]): [ReturnField, ReturnField, ReturnField] {
  const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  return [field4X, field4Y, field4Color];
}

function line_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const [field4X, field4Y, field4Color] = splitLineXY(dataProps);
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'line' },
    encoding: {
      x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
      y: { field: field4Y.name, type: 'quantitative' },
    },
  };

  if (field4Color) {
    spec.encoding.color = { field: field4Color.name, type: 'nominal' };
  }

  return spec;
}

function step_line_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const [field4X, field4Y, field4Color] = splitLineXY(dataProps);
  if (!field4X || !field4Y) return null;

  // interpolate can be step | 'step-after' | 'step-before'
  const spec: Advice['spec'] = {
    mark: { type: 'line', interpolate: 'step' },
    encoding: {
      x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
      y: { field: field4Y.name, type: 'quantitative' },
    },
  };

  if (field4Color) {
    spec.encoding.color = { field: field4Color.name, type: 'nominal' };
  }

  return spec;
}

function area_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  return {
    mark: { type: 'area' },
    encoding: {
      x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
      y: { field: field4Y.name, type: 'quantitative' },
    },
  };
}

function bar_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4Y = sortedNominalFields[0];
  const field4Color = sortedNominalFields[1];
  const field4X = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'bar' },
    encoding: {
      x: { field: field4X.name, type: 'quantitative' },
      y: { field: field4Y.name, type: 'nominal' },
    },
  };

  if (field4Color) {
    spec.encoding.color = { field: field4Color.name, type: 'nominal' };
  }

  return spec;
}

function column_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4X = sortedNominalFields[0];
  const field4Color = sortedNominalFields[1];
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'bar' },
    encoding: {
      x: { field: field4X.name, type: 'nominal' },
      y: { field: field4Y.name, type: 'quantitative' },
    },
  };

  if (field4Color) {
    spec.encoding.color = { field: field4Color.name, type: 'nominal' };
  }

  return spec;
}

/** grouped_column_chart stacked_column_chart percent_stacked_column_chart */

function splitColumnXYSeries(dataProps: FieldInfo[]): [ReturnField, ReturnField, ReturnField] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4X = sortedNominalFields[0];
  const Field4Series = sortedNominalFields[1];
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, Field4Series];
}

function grouped_column_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'bar' },
    encoding: {
      x: { field: Field4Series.name, type: 'nominal' },
      y: { field: field4Y.name, type: 'quantitative' },
      column: { field: field4X.name, type: 'nominal' },
      color: { field: Field4Series.name, type: 'nominal' },
    },
  };

  return spec;
}

function stacked_column_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'bar' },
    encoding: {
      x: { field: field4X.name, type: 'nominal' },
      y: { field: field4Y.name, type: 'quantitative' },
      color: { field: Field4Series.name, type: 'nominal' },
    },
  };

  return spec;
}

/** grouped_bar_chart stacked_bar_chart percent_stacked_bar_chart */

function splitBarXYSeries(dataProps: FieldInfo[]): [ReturnField, ReturnField, ReturnField] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4Y = sortedNominalFields[0];
  const Field4Series = sortedNominalFields[1];
  const field4X = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, Field4Series];
}

function grouped_bar_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'bar' },
    encoding: {
      x: { field: field4X.name, type: 'quantitative' },
      y: { field: Field4Series.name, type: 'nominal' },
      row: { field: field4Y.name, type: 'nominal' },
      color: { field: Field4Series.name, type: 'nominal' },
    },
  };

  return spec;
}

function stacked_bar_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'bar' },
    encoding: {
      x: { field: field4X.name, type: 'quantitative' },
      y: { field: field4Y.name, type: 'nominal' },
      color: { field: Field4Series.name, type: 'nominal' },
    },
  };

  return spec;
}

function scatter_plot(dataProps: FieldInfo[]): Advice['spec'] {
  const intervalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  const sortedIntervalFields = intervalFields.sort(compare);
  const field4X = sortedIntervalFields[0];
  const field4Y = sortedIntervalFields[1];
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'circle' },
    encoding: {
      x: { field: field4X.name, type: 'quantitative' },
      y: { field: field4Y.name, type: 'quantitative' },
    },
  };

  if (field4Color) {
    spec.encoding.color = { field: field4Color.name, type: 'nominal' };
  }

  return spec;
}

function bubble_chart(dataProps: FieldInfo[]): Advice['spec'] {
  const intervalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  const triple = {
    x: intervalFields[0],
    y: intervalFields[1],
    corr: 0,
    size: intervalFields[2],
  };
  for (let i = 0; i < intervalFields.length; i++) {
    for (let j = i + 1; j < intervalFields.length; j++) {
      const p = DWAnalyzer.pearson(intervalFields[i], intervalFields[j]);
      if (Math.abs(p) > triple.corr) {
        triple.x = intervalFields[i];
        triple.y = intervalFields[j];
        triple.corr = p;
        triple.size = intervalFields[[...Array(intervalFields.length).keys()].find((e) => e !== i && e !== j) || 0];
      }
    }
  }

  const field4X = triple.x;
  const field4Y = triple.y;
  const field4Size = triple.size;

  const field4Color = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Nominal']));
  '';

  if (!field4X || !field4Y || !field4Size || !field4Color) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'circle' },
    encoding: {
      x: { field: field4X.name, type: 'quantitative' },
      y: { field: field4Y.name, type: 'quantitative' },
      color: { field: field4Color.name, type: 'nominal' },
      size: { field: field4Size.name, type: 'quantitative' },
    },
  };

  return spec;
}

function histogram(dataProps: FieldInfo[]): Advice['spec'] {
  const field = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  if (!field) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'bar' },
    encoding: {
      x: { field: field.name, bin: true },
      y: { aggregate: 'count' },
    },
  };

  return spec;
}

function heatmap(dataProps: FieldInfo[]): Advice['spec'] {
  const axisFields = dataProps.filter((field) => intersects(field.levelOfMeasurements, ['Nominal', 'Ordinal']));
  const sortedFields = axisFields.sort(compare);
  const field4X = sortedFields[0];
  const field4Y = sortedFields[1];
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y || !field4Color) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'rect' },
    encoding: {
      x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
      y: { field: field4Y.name, type: LOM2EncodingType(field4Y.levelOfMeasurements[0]) },
      color: { field: field4Color.name, type: 'quantitative' },
    },
  };

  return spec;
}
