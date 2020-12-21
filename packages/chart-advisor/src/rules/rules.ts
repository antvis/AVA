import { Rule, DataProps } from './concepts/rule';
import {
  CKBJson,
  LevelOfMeasurement as LOM,
  ChartID as ChartType,
  DataPrerequisiteJSON,
  ChartID,
} from '@antv/knowledge';

const Wiki = CKBJson('en-US', true);

/**
 * @public
 */
export type ChartRuleID =
  | 'data-check'
  | 'data-field-qty'
  | 'no-redundant-field'
  | 'purpose-check'
  | 'series-qty-limit'
  | 'bar-series-qty'
  | 'line-field-time-ordinal'
  | 'landscape-or-portrait'
  | 'diff-pie-sector'
  | 'nominal-enum-combinatorial'
  | 'limit-series'
  | 'aggregation-single-row';

/**
 * @public
 */
export interface ChartRuleConfig {
  weight?: number;
  off?: boolean;
  limit?: number;
}

/**
 * @public
 */
export type ChartRuleConfigMap = {
  [K in ChartRuleID]?: ChartRuleConfig;
};

const allChartTypes: ChartType[] = Object.keys(Wiki) as ChartType[];
// console.log('allChartTypes: ', allChartTypes.includes('kpi_chart'));

function compare(f1: any, f2: any) {
  if (f1.distinct < f2.distinct) {
    return 1;
  } else if (f1.distinct > f2.distinct) {
    return -1;
  } else {
    return 0;
  }
}

function hasSubset(array1: any[], array2: any[]): boolean {
  return array2.every((e) => array1.includes(e));
}

function intersects(array1: any[], array2: any[]): boolean {
  return array2.some((e) => array1.includes(e));
}

function verifyDataProps(dataPre: DataPrerequisiteJSON, dataProps: DataProps[]) {
  const fieldsLOMs: LOM[][] = dataProps.map((info: any) => {
    return info.levelOfMeasurements as LOM[];
  });
  if (fieldsLOMs) {
    let lomCount = 0;
    for (const fieldLOM of fieldsLOMs) {
      if (fieldLOM && intersects(fieldLOM, dataPre.fieldConditions)) {
        lomCount += 1;
      }
    }
    if (lomCount >= dataPre.minQty && (lomCount <= dataPre.maxQty || dataPre.maxQty === '*')) {
      return true;
    }
  }
  return false;
}

/**
 * @public
 */
export const ChartRules: Rule[] = [
  // Data must satisfy the data prerequisites
  new Rule('data-check', 'HARD', allChartTypes, 1.0, (args): number => {
    let result = 0;
    const { dataProps, chartType } = args;

    if (dataProps && chartType && Wiki[chartType]) {
      result = 1;
      const dataPres = Wiki[chartType].dataPres || [];

      for (const dataPre of dataPres) {
        if (!verifyDataProps(dataPre, dataProps)) {
          result = 0;
          return result;
        }
      }
    }
    return result;
  }),
  // Data must has the min qty of the prerequisite.
  new Rule('data-field-qty', 'HARD', allChartTypes, 1.0, (args): number => {
    let result = 0;
    const { dataProps, chartType } = args;
    if (dataProps && chartType && Wiki[chartType]) {
      result = 1;
      const dataPres = Wiki[chartType].dataPres || [];
      const minFieldQty = dataPres.map((e: any) => e.minQty).reduce((acc: number, cv: number) => acc + cv);

      if (dataProps.length) {
        const fieldQty = dataProps.length;
        if (fieldQty >= minFieldQty) {
          result = 1;
        }
      }
    }
    return result;
  }),
  // No redundant field
  new Rule('no-redundant-field', 'HARD', allChartTypes, 1.0, (args): number => {
    let result = 0;
    const { dataProps, chartType } = args;

    if (dataProps && chartType && Wiki[chartType]) {
      const dataPres = Wiki[chartType].dataPres || [];
      const maxFieldQty = dataPres
        .map((e: any) => {
          if (e.maxQty === '*') {
            return 99;
          }
          return e.maxQty;
        })
        .reduce((acc: number, cv: number) => acc + cv);

      if (dataProps.length) {
        const fieldQty = dataProps.length;
        if (fieldQty <= maxFieldQty) {
          result = 1;
        }
      }
    }

    return result;
  }),
  // Choose types that satisfy the purpose, if purpose is defined.
  new Rule('purpose-check', 'HARD', allChartTypes, 1.0, (args): number => {
    let result = 0;
    const { chartType, purpose } = args;

    // if purpose is not defined
    if (!purpose) {
      result = 1;
      return result;
    }

    if (chartType && Wiki[chartType] && purpose) {
      const purp = Wiki[chartType].purpose || '';
      if (purp.includes(purpose)) {
        result = 1;
        return result;
      }
    }

    return result;
  }),
  // Some charts should has at most N series.
  new Rule(
    'series-qty-limit',
    'SOFT',
    ['pie_chart', 'donut_chart', 'radar_chart', 'rose_chart'],
    0.8,
    (args): number => {
      let result = 0;
      const { dataProps, chartType } = args;
      let { limit } = args;

      if (!Number.isInteger(limit) || limit <= 0) {
        limit = 6;
        if (chartType === 'pie_chart' || chartType === 'donut_chart' || chartType === 'rose_chart') limit = 6;
        if (chartType === 'radar_chart') limit = 8;
      }

      if (dataProps) {
        const field4Series = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
        const seriesQty = field4Series && field4Series.count ? field4Series.count : 0;
        if (seriesQty >= 2 && seriesQty <= limit) {
          result = 2 / seriesQty;
        }
      }
      return result;
    }
  ),
  // Bar chart should has proper number of bars or bar groups.
  new Rule(
    'bar-series-qty',
    'SOFT',
    [
      'bar_chart',
      'grouped_bar_chart',
      'stacked_bar_chart',
      'percent_stacked_bar_chart',
      'column_chart',
      'grouped_column_chart',
      'stacked_column_chart',
      'percent_stacked_column_chart',
    ],
    0.5,
    (args): number => {
      let result = 0;
      const { dataProps, chartType } = args;
      if (dataProps && chartType) {
        const field4Series = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
        const seriesQty = field4Series && field4Series.count ? field4Series.count : 0;
        // TODO limit for this rule
        if (seriesQty >= 2 && seriesQty <= 20) {
          result = 1;
        } else if (seriesQty > 20) {
          result = 20 / seriesQty;
        }
      }
      return result;
    }
  ),
  // Data has Time or Ordinal field are good for Line, Area charts.
  new Rule(
    'line-field-time-ordinal',
    'SOFT',
    ['line_chart', 'area_chart', 'stacked_area_chart', 'percent_stacked_area_chart'],
    1.0,
    (args): number => {
      let result = 0;
      const { dataProps } = args;
      if (dataProps) {
        const field4TimeOrOrdinal = dataProps.find((field) =>
          intersects(field.levelOfMeasurements, ['Ordinal', 'Time'])
        );

        if (field4TimeOrOrdinal) {
          result = 1;
        }
      }
      return result;
    }
  ),
  // Landscape or portrait as perferences.
  new Rule(
    'landscape-or-portrait',
    'SOFT',
    [
      'bar_chart',
      'grouped_bar_chart',
      'stacked_bar_chart',
      'percent_stacked_bar_chart',
      'column_chart',
      'grouped_column_chart',
      'stacked_column_chart',
      'percent_stacked_column_chart',
    ],
    0.3,
    (args): number => {
      let result = 0;
      const { dataProps, chartType, preferences } = args;

      if (dataProps && chartType && preferences && preferences.canvasLayout) {
        if (
          preferences.canvasLayout === 'portrait' &&
          ['bar_chart', 'grouped_bar_chart', 'stacked_bar_chart', 'percent_stacked_bar_chart'].includes(chartType)
        ) {
          result = 1;
        } else if (
          preferences.canvasLayout === 'landscape' &&
          ['column_chart', 'grouped_column_chart', 'stacked_column_chart', 'percent_stacked_column_chart'].includes(
            chartType
          )
        ) {
          result = 1;
        }
      }

      return result;
    }
  ),
  // Difference should be big enough for pie sectors.
  new Rule('diff-pie-sector', 'SOFT', ['pie_chart', 'donut_chart'], 0.5, (args): number => {
    let result = 0;
    const { dataProps } = args;

    if (dataProps) {
      const intervalField = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      if (intervalField && intervalField.sum && intervalField.samples) {
        const sum = intervalField.sum;
        const scale = 1 / sum;
        const scaledSamples = intervalField.samples.map((v: number) => v * scale);

        const scaledProduct = scaledSamples.reduce((a: number, c: number) => a * c);

        const count = intervalField.samples.length;
        const maxProduct = Math.pow(1 / count, count);

        result = Math.abs(maxProduct - Math.abs(scaledProduct)) / maxProduct;
      }
    }

    return result;
  }),
  // Single (Basic) and Multi (Stacked, Grouped,...) charts should be optimizedly recommended by nominal enums combinatorial numbers.
  new Rule('nominal-enum-combinatorial', 'SOFT', allChartTypes, 1.0, (args): number => {
    let result = 0;
    const { dataProps, chartType } = args;

    if (dataProps && allChartTypes) {
      const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));

      if (nominalFields.length >= 2) {
        const sortedNominals = nominalFields.sort(compare);

        const f1 = sortedNominals[0];
        const f2 = sortedNominals[1];

        if (f1.distinct === f1.count) {
          if (['bar_chart', 'column_chart'].includes(chartType)) {
            result = 1;
          }
        }

        if (f1.count && f1.distinct && f2.distinct && f1.count > f1.distinct) {
          const typeOptions: ChartID[] = [
            'grouped_bar_chart',
            'grouped_column_chart',
            'stacked_bar_chart',
            'stacked_column_chart',
          ];
          if (typeOptions.includes(chartType)) {
            result = 1;
          }
        }
      }
    }

    return result;
  }),
  // Avoid too many series
  new Rule('limit-series', 'SOFT', allChartTypes, 1.0, (args): number => {
    let result = 0;
    const { dataProps, chartType } = args;

    if (dataProps && allChartTypes) {
      const nominalOrOrdinalFields = dataProps.filter((field) =>
        intersects(field.levelOfMeasurements, ['Nominal', 'Ordinal'])
      );
      if (nominalOrOrdinalFields.length >= 2) {
        const sortedFields = nominalOrOrdinalFields.sort(compare);

        // const f1 = sortedNominals[0];
        const f2 = sortedFields[1];

        if (f2.distinct) {
          result = 1 / f2.distinct;

          if (f2.distinct > 6 && chartType === 'heatmap') {
            result = 2;
          } else if (chartType === 'heatmap') {
            result = 0;
          }
        }
      }
    }

    return result;
  }),
  // 只有一列汇总信息
  new Rule('aggregation-single-row', 'SOFT', ['kpi_chart'], 1.0, (args): number => {
    let result = 0;
    const { dataProps } = args;
    if (dataProps.every((i) => i.count === 1 && i.levelOfMeasurements.includes('Interval'))) {
      result = 1;
    }
    return result;
  }),
  // end
];
