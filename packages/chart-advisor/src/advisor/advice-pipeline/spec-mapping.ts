import { ChartID, CHART_ID_OPTIONS, LevelOfMeasurement as LOM } from '@antv/ckb';
import { isInHierarchy } from '@antv/dw-util';
import * as DWAnalyzer from '@antv/dw-analyzer';
import { BasicDataPropertyForAdvice } from '../../ruler';
// FIXME MOCK before DW publish
import { DataFrame } from '../utils/dataframe';
import { hasSubset, intersects } from '../../utils';
import { compare } from '../utils';
import { CustomizedCKBJSON } from '../ckb-config';
import { Advice } from './interface';

type EncodingType = 'quantitative' | 'temporal' | 'ordinal' | 'nominal'; // TODO support in AntVSpec | 'geojson';

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

/* !!!START pie_chart & donut_chart ------------------- */
function splitAngleColor(dataProps: BasicDataPropertyForAdvice[]): [ReturnField, ReturnField] {
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const field4Angle = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4Color, field4Angle];
}

function pieChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4Color, field4Angle] = splitAngleColor(dataProps);
  if (!field4Angle || !field4Color) return null;

  const spec: Advice['spec'] = {
    basis: {
      type: 'chart',
    },
    data: {
      type: 'json-array',
      values: dataFrame.toJson(),
    },
    layer: [
      {
        mark: {
          type: 'arc',
        },
        encoding: {
          theta: { field: field4Angle.name, type: 'quantitative' },
          color: { field: field4Color.name, type: 'nominal' },
        },
      },
    ],
  };
  return spec;
}

function donutChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4Color, field4Angle] = splitAngleColor(dataProps);
  if (!field4Angle || !field4Color) return null;

  const spec: Advice['spec'] = {
    basis: {
      type: 'chart',
    },
    data: {
      type: 'json-array',
      values: dataFrame.toJson(),
    },
    layer: [
      {
        mark: {
          type: 'arc',
          style: {
            innerRadius: 20,
          },
        },
        encoding: {
          theta: { field: field4Angle.name, type: 'quantitative' },
          color: { field: field4Color.name, type: 'nominal' },
        },
      },
    ],
  };
  return spec;
}
/* !!!END pie_chart & donut_chart ------------------- */

/* !!!START line_chart & step_line_chart ------------------- */
function splitLineXY(dataProps: BasicDataPropertyForAdvice[]): [ReturnField, ReturnField, ReturnField] {
  const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  return [field4X, field4Y, field4Color];
}

function lineChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4X, field4Y, field4Color] = splitLineXY(dataProps);
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'line' },
        encoding: {
          x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
          y: { field: field4Y.name, type: 'quantitative' },
        },
      },
    ],
  };

  if (field4Color) {
    spec.layer[0].encoding.color = { field: field4Color.name, type: 'nominal' };
  }

  return spec;
}

function stepLineChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4X, field4Y, field4Color] = splitLineXY(dataProps);
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'line', interpolate: 'step' },
        encoding: {
          x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
          y: { field: field4Y.name, type: 'quantitative' },
        },
      },
    ],
  };

  if (field4Color) {
    spec.layer[0].encoding.color = { field: field4Color.name, type: 'nominal' };
  }

  return spec;
}

/* !!!END line_chart & step_line_chart ------------------- */

/* !!!START area_chart & stack_area_chart & percent_stacked_area_chart ------------------- */
function splitAreaXYSeries(dataProps: BasicDataPropertyForAdvice[]): [ReturnField, ReturnField, ReturnField] {
  const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
  const field4Series = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, field4Series];
}

function areaChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'area' },
        encoding: {
          x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
          y: { field: field4Y.name, type: 'quantitative' },
        },
      },
    ],
  };

  return spec;
}

function stackedAreaChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4X, field4Y, field4Series] = splitAreaXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'area' },
        encoding: {
          x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
          y: { field: field4Y.name, type: 'quantitative' },
          color: { field: field4Series.name, type: 'nominal' },
        },
      },
    ],
  };

  return spec;
}

function percentStackedAreaChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4X, field4Y, field4Series] = splitAreaXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'area' },
        encoding: {
          x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
          y: { field: field4Y.name, type: 'quantitative', stack: 'normalize' },
          color: { field: field4Series.name, type: 'nominal' },
        },
      },
    ],
  };

  return spec;
}

/* !!!END area_chart & stack_area_chart & percent_stacked_area_chart ------------------- */

/* !!!START bar_chart & group_bar_chart & stack_bar_chart & percent_stacked_bar_chart ------------------- */
function splitBarXYSeries(dataProps: BasicDataPropertyForAdvice[]): [ReturnField, ReturnField, ReturnField] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4Y = sortedNominalFields[0];
  const field4Series = sortedNominalFields[1];
  const field4X = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, field4Series];
}

// barchart in AVA means: horizontal bar chart
function barChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4Y = sortedNominalFields[0];
  const field4Color = sortedNominalFields[1];
  const field4X = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'bar' },
        encoding: {
          x: { field: field4X.name, type: 'quantitative' },
          y: { field: field4Y.name, type: 'nominal' },
        },
      },
    ],
  };

  if (field4Color) {
    spec.layer[0].encoding.color = { field: field4Color.name, type: 'nominal' };
  }

  return spec;
}

function groupedBarChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4X, field4Y, field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'bar' },
        encoding: {
          x: { field: field4X.name, type: 'quantitative' },
          y: { field: field4Series.name, type: 'nominal' },
          row: { field: field4Y.name, type: 'nominal' },
          color: { field: field4Series.name, type: 'nominal' },
        },
      },
    ],
  };

  return spec;
}

function stackedBarChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4X, field4Y, field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'bar' },
        encoding: {
          x: { field: field4X.name, type: 'quantitative' },
          y: { field: field4Y.name, type: 'nominal' },
          color: { field: field4Series.name, type: 'nominal' },
        },
      },
    ],
  };

  return spec;
}

function percentStackedBarChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4X, field4Y, field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'bar' },
        encoding: {
          x: { field: field4X.name, type: 'quantitative', stack: 'normalize' },
          y: { field: field4Y.name, type: 'nominal' },
          color: { field: field4Series.name, type: 'nominal' },
        },
      },
    ],
  };

  return spec;
}

/* !!!END bar_chart & group_bar_chart & stack_bar_chart & percent_stacked_bar_chart ------------------- */

/* !!!START column_chart & grouped_column_chart & stacked_column_chart & percent_stacked_column_chart ------------------- */
function splitColumnXYSeries(dataProps: BasicDataPropertyForAdvice[]): [ReturnField, ReturnField, ReturnField] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);

  let field4X;
  let Field4Series;
  if (isInHierarchy(sortedNominalFields[1]?.samples, sortedNominalFields[0]?.samples)) {
    [Field4Series, field4X] = sortedNominalFields;
  } else {
    [field4X, Field4Series] = sortedNominalFields;
  }

  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, Field4Series];
}

function columnChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4X = sortedNominalFields[0];
  const field4Color = sortedNominalFields[1];
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'bar' },
        encoding: {
          x: { field: field4Y.name, type: 'nominal' },
          y: { field: field4X.name, type: 'quantitative' },
        },
      },
    ],
  };

  if (field4Color) {
    spec.layer[0].encoding.color = { field: field4Color.name, type: 'nominal' };
  }

  return spec;
}

function groupedColumnChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'bar' },
        encoding: {
          x: { field: Field4Series.name, type: 'nominal' },
          y: { field: field4Y.name, type: 'quantitative' },
          column: { field: field4X.name, type: 'nominal' },
          color: { field: Field4Series.name, type: 'nominal' },
        },
      },
    ],
  };

  return spec;
}

function stackedColumnChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'bar' },
        encoding: {
          x: { field: field4X.name, type: 'nominal' },
          y: { field: field4Y.name, type: 'quantitative', stack: 'zero' },
          color: { field: Field4Series.name, type: 'nominal' },
        },
      },
    ],
  };

  return spec;
}

function percentStackedColumnChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'bar' },
        encoding: {
          x: { field: field4X.name, type: 'nominal' },
          y: { field: field4Y.name, type: 'quantitative', stack: 'normalize' },
          color: { field: Field4Series.name, type: 'nominal' },
        },
      },
    ],
  };

  return spec;
}

/* !!!END column_chart & grouped_column_chart & stacked_column_chart & percent_stacked_column_chart ------------------- */

/* !!!START scatter_plot ------------------- */
function scatterPlot(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const intervalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  const sortedIntervalFields = intervalFields.sort(compare);
  const field4X = sortedIntervalFields[0];
  const field4Y = sortedIntervalFields[1];
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    basis: {
      type: 'chart',
    },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: 'point',
        encoding: {
          x: { field: field4X.name, type: 'quantitative' },
          y: { field: field4Y.name, type: 'quantitative' },
        },
      },
    ],
  };

  if (field4Color) {
    spec.layer[0].encoding.color = { field: field4Color.name, type: 'nominal' };
  }

  return spec;
}
/* !!!END scatter_plot ------------------- */

/* !!!START bubble_chart ------------------- */
function bubbleChart(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const intervalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  const triple = {
    x: intervalFields[0],
    y: intervalFields[1],
    corr: 0,
    size: intervalFields[2],
  };
  for (let i = 0; i < intervalFields.length; i += 1) {
    for (let j = i + 1; j < intervalFields.length; j += 1) {
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

  // require x,y,size,color at the same time
  if (!field4X || !field4Y || !field4Size || !field4Color) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'point' },
        encoding: {
          x: { field: field4X.name, type: 'quantitative' },
          y: { field: field4Y.name, type: 'quantitative' },
          color: { field: field4Color.name, type: 'nominal' },
          size: { field: field4Size.name, type: 'quantitative' },
        },
      },
    ],
  };

  return spec;
}
/* !!!END bubble_chart ------------------- */

/* !!!START histogram ------------------- */
function histogram(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const field = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  if (!field) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: 'bar',
        encoding: {
          x: { type: 'quantitative', field: field.name, bin: true },
          y: { type: 'quantitative', aggregate: 'count' },
        },
      },
    ],
  };

  return spec;
}
/* !!!END histogram ------------------- */

/* !!!END heatmap ------------------- */
function heatmap(dataFrame: DataFrame): Advice['spec'] {
  const { dataProps } = dataFrame;
  const axisFields = dataProps.filter((field) => intersects(field.levelOfMeasurements, ['Nominal', 'Ordinal']));
  const sortedFields = axisFields.sort(compare);
  const field4X = sortedFields[0];
  const field4Y = sortedFields[1];
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y || !field4Color) return null;

  const spec: Advice['spec'] = {
    basis: { type: 'chart' },
    data: { type: 'json-array', values: dataFrame.toJson() },
    layer: [
      {
        mark: { type: 'rect' },
        encoding: {
          x: { field: field4X.name, type: LOM2EncodingType(field4X.levelOfMeasurements[0]) },
          y: { field: field4Y.name, type: LOM2EncodingType(field4Y.levelOfMeasurements[0]) },
          color: { field: field4Color.name, type: 'quantitative' },
        },
      },
    ],
  };

  return spec;
}
/* !!!END heatmap ------------------- */

// TODO other chartSpec generator

/**
 * Convert chartType + data to antv-spec
 * recommend chart with specific data mapping
 *
 * @param chartType chart type
 * @param dataProps data property for advisor
 * @param dataset dataset
 * @returns spec or null
 */
export function getChartTypeSpec(chartType: string, dataFrame: DataFrame, chartKnowledge?: CustomizedCKBJSON) {
  // step 0: check whether the chartType is default in `ChartID`
  // TODO what to do if user input ckb
  if (!CHART_ID_OPTIONS.includes(chartType as ChartID) && chartKnowledge) {
    if (chartKnowledge.toSpec) {
      const spec = chartKnowledge.toSpec(dataFrame);
      return spec;
    }
    return null;
  }
  switch (chartType) {
    // pie
    case 'pie_chart':
      return pieChart(dataFrame);
    case 'donut_chart':
      return donutChart(dataFrame);
    // line
    case 'line_chart':
      return lineChart(dataFrame);
    case 'step_line_chart':
      return stepLineChart(dataFrame);
    // area
    case 'area_chart':
      return areaChart(dataFrame);
    case 'stacked_area_chart':
      return stackedAreaChart(dataFrame);
    case 'percent_stacked_area_chart':
      return percentStackedAreaChart(dataFrame);
    // bar
    case 'bar_chart':
      return barChart(dataFrame);
    case 'grouped_bar_chart':
      return groupedBarChart(dataFrame);
    case 'stacked_bar_chart':
      return stackedBarChart(dataFrame);
    case 'percent_stacked_bar_chart':
      return percentStackedBarChart(dataFrame);
    // column
    case 'column_chart':
      return columnChart(dataFrame);
    case 'grouped_column_chart':
      return groupedColumnChart(dataFrame);
    case 'stacked_column_chart':
      return stackedColumnChart(dataFrame);
    case 'percent_stacked_column_chart':
      return percentStackedColumnChart(dataFrame);
    // scatter
    case 'scatter_plot':
      return scatterPlot(dataFrame);
    // bubble
    case 'bubble_chart':
      return bubbleChart(dataFrame);
    // histogram
    case 'histogram':
      return histogram(dataFrame);
    case 'heatmap':
      return heatmap(dataFrame);
    // TODO other case 'kpi_panel' & 'table'
    default:
      return null;
  }
}

type ReturnField = BasicDataPropertyForAdvice | undefined;
