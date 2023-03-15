import { CHART_IDS } from '../../ckb';
import { pearson, isParentChild } from '../../data';
import { compare, hasSubset, intersects } from '../utils';

import type { Data } from '../../common/types';
import type { CkbTypes } from '../../ckb';
import type { Advice } from '../types';
import type { BasicDataPropertyForAdvice } from '../ruler';

declare type ChartID = (typeof CHART_IDS)[number];

/* !!!START pie_chart & donut_chart ------------------- */
function splitAngleColor(dataProps: BasicDataPropertyForAdvice[]): [ReturnField, ReturnField] {
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const field4Angle = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4Color, field4Angle];
}

function pieChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4Color, field4Angle] = splitAngleColor(dataProps);
  if (!field4Angle || !field4Color) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      color: field4Color.name,
      y: field4Angle.name,
    },
    coordinate: { type: 'theta' },
  };
  return spec;
}

function donutChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4Color, field4Angle] = splitAngleColor(dataProps);
  if (!field4Angle || !field4Color) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      color: field4Color.name,
      y: field4Angle.name,
    },
    coordinate: { type: 'theta', innerRadius: 0.6 },
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

function lineChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Color] = splitLineXY(dataProps);
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'line',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
  }

  return spec;
}

function stepLineChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Color] = splitLineXY(dataProps);
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'line',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      shape: 'hvh',
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
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

function areaChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'area',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
    },
  };

  return spec;
}

function stackedAreaChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitAreaXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'area',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Series.name,
    },
    transform: [{ type: 'stackY' }],
  };

  return spec;
}

function percentStackedAreaChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitAreaXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'area',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Series.name,
    },
    transform: [{ type: 'stackY' }, { type: 'normalizeY' }],
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
function barChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4Y = sortedNominalFields[0];
  const field4Color = sortedNominalFields[1];
  const field4X = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
    },
    coordinate: {
      transform: [{ type: 'transpose' }],
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
  }

  return spec;
}

function groupedBarChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Series.name,
    },
    transform: [{ type: 'dodgeX' }],
    coordinate: {
      transform: [{ type: 'transpose' }],
    },
  };

  return spec;
}

function stackedBarChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Series.name,
    },
    coordinate: {
      transform: [{ type: 'transpose' }],
    },
  };

  return spec;
}

function percentStackedBarChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Series.name,
    },
    transform: [{ type: 'stackY' }, { type: 'normalizeY' }],
    coordinate: {
      transform: [{ type: 'transpose' }],
    },
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
  if (isParentChild(sortedNominalFields[1]?.rawData, sortedNominalFields[0]?.rawData)) {
    [Field4Series, field4X] = sortedNominalFields;
  } else {
    [field4X, Field4Series] = sortedNominalFields;
  }

  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, Field4Series];
}

function columnChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4X = sortedNominalFields[0];
  const field4Color = sortedNominalFields[1];
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
  }

  return spec;
}

function groupedColumnChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitColumnXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Series.name,
    },
    transform: [{ type: 'dodgeX' }],
  };

  return spec;
}

function stackedColumnChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: Field4Series.name,
    },
    transform: [{ type: 'stackY' }],
  };

  return spec;
}

function percentStackedColumnChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: Field4Series.name,
    },
    transform: [{ type: 'stackY' }, { type: 'normalizeY' }],
  };

  return spec;
}

/* !!!END column_chart & grouped_column_chart & stacked_column_chart & percent_stacked_column_chart ------------------- */

/* !!!START scatter_plot ------------------- */
function scatterPlot(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const intervalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  const sortedIntervalFields = intervalFields.sort(compare);
  const field4X = sortedIntervalFields[0];
  const field4Y = sortedIntervalFields[1];
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'point',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
  }

  return spec;
}
/* !!!END scatter_plot ------------------- */

/* !!!START bubble_chart ------------------- */
function bubbleChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const intervalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  const triple = {
    x: intervalFields[0],
    y: intervalFields[1],
    corr: 0,
    size: intervalFields[2],
  };
  for (let i = 0; i < intervalFields.length; i += 1) {
    for (let j = i + 1; j < intervalFields.length; j += 1) {
      const p = pearson(intervalFields[i].rawData, intervalFields[j].rawData);
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
    type: 'point',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Color.name,
      size: field4Size.name,
    },
  };

  return spec;
}
/* !!!END bubble_chart ------------------- */

/* !!!START histogram ------------------- */
function histogram(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const field = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  if (!field) return null;

  const spec: Advice['spec'] = {
    type: 'rect',
    data,
    encode: {
      x: field.name,
    },
    transform: [{ type: 'binX', y: 'count' }],
  };

  return spec;
}
/* !!!END histogram ------------------- */

/* !!!END heatmap ------------------- */
function heatmap(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const axisFields = dataProps.filter((field) => intersects(field.levelOfMeasurements, ['Nominal', 'Ordinal']));
  const sortedFields = axisFields.sort(compare);
  const field4X = sortedFields[0];
  const field4Y = sortedFields[1];
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y || !field4Color) return null;

  const spec: Advice['spec'] = {
    type: 'cell',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Color.name,
    },
  };

  return spec;
}
/* !!!END heatmap ------------------- */

/**
 * Convert chartType + data to antv-spec
 * recommend chart with specific data mapping
 *
 * @param chartType chart type
 * @param data input data [ { col1: ..., col2: ... } ]
 * @param dataProps data property for advisor derived by data-wizard
 * @param chartKnowledge chart knowledge of a singble chart
 * @returns spec or null
 */
export function getChartTypeSpec(
  chartType: string,
  data: Data,
  dataProps: BasicDataPropertyForAdvice[],
  chartKnowledge?: CkbTypes.ChartKnowledge
) {
  // step 0: check whether the chartType is default in `ChartID`
  // if not, use customized `toSpec` function
  if (!CHART_IDS.includes(chartType as ChartID) && chartKnowledge) {
    if (chartKnowledge.toSpec) {
      const spec = chartKnowledge.toSpec(data, dataProps);
      return spec;
    }
    return null;
  }
  switch (chartType) {
    // pie
    case 'pie_chart':
      return pieChart(data, dataProps);
    case 'donut_chart':
      return donutChart(data, dataProps);
    // line
    case 'line_chart':
      return lineChart(data, dataProps);
    case 'step_line_chart':
      return stepLineChart(data, dataProps);
    // area
    case 'area_chart':
      return areaChart(data, dataProps);
    case 'stacked_area_chart':
      return stackedAreaChart(data, dataProps);
    case 'percent_stacked_area_chart':
      return percentStackedAreaChart(data, dataProps);
    // bar
    case 'bar_chart':
      return barChart(data, dataProps);
    case 'grouped_bar_chart':
      return groupedBarChart(data, dataProps);
    case 'stacked_bar_chart':
      return stackedBarChart(data, dataProps);
    case 'percent_stacked_bar_chart':
      return percentStackedBarChart(data, dataProps);
    // column
    case 'column_chart':
      return columnChart(data, dataProps);
    case 'grouped_column_chart':
      return groupedColumnChart(data, dataProps);
    case 'stacked_column_chart':
      return stackedColumnChart(data, dataProps);
    case 'percent_stacked_column_chart':
      return percentStackedColumnChart(data, dataProps);
    // scatter
    case 'scatter_plot':
      return scatterPlot(data, dataProps);
    // bubble
    case 'bubble_chart':
      return bubbleChart(data, dataProps);
    // histogram
    case 'histogram':
      return histogram(data, dataProps);
    case 'heatmap':
      return heatmap(data, dataProps);
    // TODO other case 'kpi_panel' & 'table'
    default:
      return null;
  }
}

type ReturnField = BasicDataPropertyForAdvice | undefined;
