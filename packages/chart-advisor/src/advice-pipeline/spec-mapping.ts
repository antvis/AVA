import { ChartID, LevelOfMeasurement as LOM } from '@antv/knowledge';
import { Dataset, isInHierarchy } from '@antv/dw-util';
import * as DWAnalyzer from '@antv/dw-analyzer';
import { DataProperty, Advice } from './interface';
import { EncodingType } from './vega-lite';

export function getChartTypeSpec(chartType: ChartID, dataProps: DataProperty[], dataset?: Dataset): Advice['spec'] {
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
    case 'stacked_area_chart':
      return stacked_area_chart(dataProps);
    case 'percent_stacked_area_chart':
      return percent_stacked_area_chart(dataProps);
    case 'bar_chart':
      return bar_chart(dataProps);
    case 'grouped_bar_chart':
      return grouped_bar_chart(dataProps);
    case 'stacked_bar_chart':
      return stacked_bar_chart(dataProps);
    case 'percent_stacked_bar_chart':
      return percent_stacked_bar_chart(dataProps);
    case 'column_chart':
      return column_chart(dataProps);
    case 'grouped_column_chart':
      return grouped_column_chart(dataProps, dataset);
    case 'stacked_column_chart':
      return stacked_column_chart(dataProps, dataset);
    case 'percent_stacked_column_chart':
      return percent_stacked_column_chart(dataProps, dataset);
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
    case 'kpi_panel':
      return kpi_panel();
    case 'table':
      return table(dataProps);
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

function compare(f1: DataProperty, f2: DataProperty): number {
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

type ReturnField = DataProperty | undefined;

/* pie_chart & donut_chart */

function splitAngleColor(dataProps: DataProperty[]): [ReturnField, ReturnField] {
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const field4Angle = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4Color, field4Angle];
}

function pie_chart(dataProps: DataProperty[]): Advice['spec'] {
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

function donut_chart(dataProps: DataProperty[]): Advice['spec'] {
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

function splitLineXY(dataProps: DataProperty[]): [ReturnField, ReturnField, ReturnField] {
  const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  return [field4X, field4Y, field4Color];
}

function line_chart(dataProps: DataProperty[]): Advice['spec'] {
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

function step_line_chart(dataProps: DataProperty[]): Advice['spec'] {
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

function area_chart(dataProps: DataProperty[]): Advice['spec'] {
  const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'area' },
    encoding: {
      x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
      y: { field: field4Y.name, type: 'quantitative' },
    },
  };

  return spec;
}

function splitAreaXYSeries(dataProps: DataProperty[]): [ReturnField, ReturnField, ReturnField] {
  const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
  const field4Series = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, field4Series];
}

function stacked_area_chart(dataProps: DataProperty[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitAreaXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'area' },
    encoding: {
      x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
      y: { field: field4Y.name, type: 'quantitative', stack: 'zero' },
      color: { field: field4Series.name, type: 'nominal' },
    },
  };

  return spec;
}

function percent_stacked_area_chart(dataProps: DataProperty[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitAreaXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'area' },
    encoding: {
      x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
      y: { field: field4Y.name, type: 'quantitative', stack: 'normalize' },
      color: { field: field4Series.name, type: 'nominal' },
    },
  };

  return spec;
}

function bar_chart(dataProps: DataProperty[]): Advice['spec'] {
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

function column_chart(dataProps: DataProperty[]): Advice['spec'] {
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

function splitColumnXYSeries(dataProps: DataProperty[], dataset?: Dataset): [ReturnField, ReturnField, ReturnField] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);

  let field4X;
  let Field4Series;
  if (dataset && isInHierarchy(sortedNominalFields[1]?.samples, sortedNominalFields[0]?.samples)) {
    field4X = sortedNominalFields[1];
    Field4Series = sortedNominalFields[0];
  } else {
    field4X = sortedNominalFields[0];
    Field4Series = sortedNominalFields[1];
  }

  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, Field4Series];
}

function grouped_column_chart(dataProps: DataProperty[], dataset?: Dataset): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps, dataset);
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

function stacked_column_chart(dataProps: DataProperty[], dataset?: Dataset): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps, dataset);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'bar' },
    encoding: {
      x: { field: field4X.name, type: 'nominal' },
      y: { field: field4Y.name, type: 'quantitative', stack: 'zero' },
      color: { field: Field4Series.name, type: 'nominal' },
    },
  };

  return spec;
}

function percent_stacked_column_chart(dataProps: DataProperty[], dataset?: Dataset): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps, dataset);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'bar' },
    encoding: {
      x: { field: field4X.name, type: 'nominal' },
      y: { field: field4Y.name, type: 'quantitative', stack: 'normalize' },
      color: { field: Field4Series.name, type: 'nominal' },
    },
  };

  return spec;
}

/** grouped_bar_chart stacked_bar_chart percent_stacked_bar_chart */

function splitBarXYSeries(dataProps: DataProperty[]): [ReturnField, ReturnField, ReturnField] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4Y = sortedNominalFields[0];
  const Field4Series = sortedNominalFields[1];
  const field4X = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, Field4Series];
}

function grouped_bar_chart(dataProps: DataProperty[]): Advice['spec'] {
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

function stacked_bar_chart(dataProps: DataProperty[]): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'bar' },
    encoding: {
      x: { field: field4X.name, type: 'quantitative', stack: 'zero' },
      y: { field: field4Y.name, type: 'nominal' },
      color: { field: Field4Series.name, type: 'nominal' },
    },
  };

  return spec;
}

function percent_stacked_bar_chart(dataProps: DataProperty[]): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    mark: { type: 'bar' },
    encoding: {
      x: { field: field4X.name, type: 'quantitative', stack: 'normalize' },
      y: { field: field4Y.name, type: 'nominal' },
      color: { field: Field4Series.name, type: 'nominal' },
    },
  };

  return spec;
}

function scatter_plot(dataProps: DataProperty[]): Advice['spec'] {
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

function bubble_chart(dataProps: DataProperty[]): Advice['spec'] {
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

function histogram(dataProps: DataProperty[]): Advice['spec'] {
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

function heatmap(dataProps: DataProperty[]): Advice['spec'] {
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

function kpi_panel(): Advice['spec'] {
  // TODO 指标卡暂不做更细致的配置，只支持基本的数值显示
  return null;
}

function table(dataProps: DataProperty[]): Advice['spec'] {
  const values = [];
  const rows = [];

  for (let i = 0; i < dataProps.length; i++) {
    const field = dataProps[i];
    if (intersects(field.levelOfMeasurements, ['Interval', 'Continuous', 'Discrete'])) {
      values.push(field.name);
    } else {
      rows.push(field.name);
    }
  }

  return {
    rows,
    values,
    columns: [],
  };
}
