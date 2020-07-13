import { CKBJson, LevelOfMeasurement as LOM, ChartID } from '@antv/knowledge';
import Rules, { Rule, Preferences } from './rules';
import * as DWAnalyzer from '@antv/dw-analyzer';
import { translate } from './util';
import { ChartLibrary, getMappingForLib } from './chartLibMapping';
import { GeometryOption } from '@antv/g2/lib/interface';

const Wiki = CKBJson('en-US', true);

/**
 * @beta
 */
export interface Channels {
  x?: string;
  x2?: string;
  y?: string;
  y2?: string;
  color?: string;
  angle?: string;
  radius?: string;
  series?: string;
  size?: string;

  // fit for G2 GeometryOption
  geometry?: GeometryOption;
}

/**
 * @beta
 */
export interface Advice {
  type: ChartID;
  channels: Channels;
  score: number;
}

/**
 * @public
 */
export interface AdvisorOptions {
  /**
   * 分析目的
   */
  purpose?: string;
  /**
   * 偏好设置
   */
  preferences?: Preferences;
  /**
   * 标题
   */
  title?: string;
  /**
   * 描述
   */
  description?: string;
}

/**
 * @beta
 */
export interface FieldInfo extends DWAnalyzer.FieldInfo {
  name: string;
  levelOfMeasurements: LOM[];
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

function hasSubset(array1: any[], array2: any[]): boolean {
  return array2.every((e) => array1.includes(e));
}

function intersects(array1: any[], array2: any[]): boolean {
  return array2.some((e) => array1.includes(e));
}

/**
 * Return Data Properties of dataset.
 * @beta
 */
export function dataToDataProps(data: any[]): FieldInfo[] {
  const dataTypeInfos = DWAnalyzer.typeAll(data);
  const dataProps: FieldInfo[] = [];

  dataTypeInfos.forEach((info) => {
    const lom = [];
    if (DWAnalyzer.isNominal(info)) lom.push('Nominal');
    if (DWAnalyzer.isOrdinal(info)) lom.push('Ordinal');
    if (DWAnalyzer.isInterval(info)) lom.push('Interval');
    if (DWAnalyzer.isDiscrete(info)) lom.push('Discrete');
    if (DWAnalyzer.isContinuous(info)) lom.push('Continuous');
    if (DWAnalyzer.isTime(info)) lom.push('Time');

    const newInfo: FieldInfo = { ...info, levelOfMeasurements: lom as LOM[] };

    dataProps.push(newInfo);
  });

  return dataProps;
}

/**
 * Return Specification list of recommend charts from data properties.
 * @beta
 */
export function dataPropsToSpecs(dataProps: FieldInfo[], options?: AdvisorOptions, showLog = false): Advice[] {
  const purpose = options ? options.purpose : '';
  const preferences = options ? options.preferences : undefined;

  const allTypes = Object.keys(Wiki) as ChartID[];

  const list: Advice[] = allTypes.map((t) => {
    // anaylze score
    let score = 0;

    // for log
    const record: Record<string, number> = {};

    let hardScore = 1;
    Rules.filter((r: Rule) => r.hardOrSoft === 'HARD' && r.specChartTypes.includes(t as ChartID)).forEach(
      (hr: Rule) => {
        const score = hr.check({ dataProps, chartType: t, purpose, preferences });
        hardScore *= score;

        // if (showLog) console.log('H rule: ', hr.id, ' ; charttype: ', t);
        // if (showLog) console.log(score);
        record[hr.id] = score;
      }
    );

    let softScore = 0;
    Rules.filter((r: Rule) => r.hardOrSoft === 'SOFT' && r.specChartTypes.includes(t as ChartID)).forEach(
      (sr: Rule) => {
        const score = sr.check({ dataProps, chartType: t, purpose, preferences });
        softScore += score;

        // if (showLog) console.log('S rule: ', sr.id, ' ; charttype: ', t);
        // if (showLog) console.log(score);
        record[sr.id] = score;
      }
    );

    score = hardScore * (1 + softScore);

    if (showLog) console.log('💯score: ', score, '=', hardScore, '* (1 +', softScore, ') ;charttype: ', t);
    if (showLog) console.log(record);

    // analyze channels
    const channels: Channels = {};
    // for Pie | Donut
    if (t === 'pie_chart' || t === 'donut_chart') {
      const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
      const field4Angle = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      if (field4Angle && field4Color) {
        channels.color = field4Color.name;
        channels.angle = field4Angle.name;
      } else {
        score = 0;
      }
    }

    // for Line
    if (t === 'line_chart' || t == 'step_line_chart') {
      const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
      const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
      const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));

      if (field4Color) {
        channels.color = field4Color.name;
      }

      if (field4X && field4Y) {
        channels.x = field4X.name;
        channels.y = field4Y.name;
      } else {
        score = 0;
      }
    }

    // for Area
    if (t === 'area_chart') {
      const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
      const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      if (field4X && field4Y) {
        channels.x = field4X.name;
        channels.y = field4Y.name;
      } else {
        score = 0;
      }
    }

    // for Bar
    if (t === 'bar_chart') {
      const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
      const sortedNominalFields = nominalFields.sort(compare);

      const field4Y = sortedNominalFields[0];
      const field4Color = sortedNominalFields[1];

      const field4X = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      if (field4X && field4Y) {
        channels.y = field4Y.name;
        channels.x = field4X.name;
        if (field4Color) {
          channels.color = field4Color.name;
        }
      } else {
        score = 0;
      }
    }

    // for Column
    if (t === 'column_chart') {
      const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
      const sortedNominalFields = nominalFields.sort(compare);

      const field4X = sortedNominalFields[0];
      const field4Color = sortedNominalFields[1];

      const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      if (field4X && field4Y) {
        channels.y = field4Y.name;
        channels.x = field4X.name;
        if (field4Color) {
          channels.color = field4Color.name;
        }
      } else {
        score = 0;
      }
    }

    // for GroupedBar | StackedBar | PercentageStackedBar
    if (t === 'grouped_bar_chart' || t === 'stacked_bar_chart' || t === 'percent_stacked_bar_chart') {
      const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));

      const sortedNominalFields = nominalFields.sort(compare);

      const field4Y1 = sortedNominalFields[0];
      const field4Y2 = sortedNominalFields[1];
      const field4X = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      if (field4Y1 && field4Y2 && field4X) {
        channels.y = field4Y1.name;
        channels.y2 = field4Y2.name;
        channels.x = field4X.name;
      } else {
        score = 0;
      }
    }

    // for GroupedColumn | StackedColumn | PercentageStackedColumn
    if (t === 'grouped_column_chart' || t === 'stacked_column_chart' || t === 'percent_stacked_column_chart') {
      const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));

      const sortedNominalFields = nominalFields.sort(compare);

      const field4X1 = sortedNominalFields[0];
      const field4X2 = sortedNominalFields[1];
      const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      if (field4X1 && field4X2 && field4Y) {
        channels.x = field4X1.name;
        channels.x2 = field4X2.name;
        channels.y = field4Y.name;
      } else {
        score = 0;
      }
    }

    // for StackedArea | PercentageStackedArea
    if (t === 'stacked_area_chart' || t === 'percent_stacked_area_chart') {
      const field4X1 = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
      const field4X2 = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
      const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      if (field4X1 && field4X2 && field4Y) {
        channels.x = field4X1.name;
        channels.x2 = field4X2.name;
        channels.y = field4Y.name;
      } else {
        score = 0;
      }
    }

    // for Radar
    if (t === 'radar_chart') {
      const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));

      const sortedNominalFields = nominalFields.sort(compare);

      const field4Angle = sortedNominalFields[0];
      const field4Series = sortedNominalFields[1];
      const field4Radius = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      if (field4Angle && field4Series && field4Radius) {
        channels.angle = field4Angle.name;
        channels.series = field4Series.name;
        channels.radius = field4Radius.name;
      } else {
        score = 0;
      }
    }

    // for Scatter
    if (t === 'scatter_plot') {
      const intervalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      const sortedIntervalFields = intervalFields.sort(compare);

      const field4X = sortedIntervalFields[0];
      const field4Y = sortedIntervalFields[1];

      const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));

      if (field4X && field4Y) {
        channels.x = field4X.name;
        channels.y = field4Y.name;
        if (field4Color) {
          channels.color = field4Color.name;
        }
      } else {
        score = 0;
      }
    }

    // for Bubble
    if (t === 'bubble_chart') {
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

      if (field4X && field4Y && field4Size && field4Color) {
        channels.x = field4X.name;
        channels.y = field4Y.name;
        channels.size = field4Size.name;
        channels.color = field4Color.name;
      } else {
        score = 0;
      }
    }

    // for Histogram
    if (t === 'histogram') {
      const field = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
      if (field) {
        channels.x = field.name;
      } else {
        score = 0;
      }
    }

    // for heatmap
    if (t === 'heatmap') {
      const axisFields = dataProps.filter((field) => intersects(field.levelOfMeasurements, ['Nominal', 'Ordinal']));
      const sortedFields = axisFields.sort(compare);
      const field4X = sortedFields[0];
      const field4Y = sortedFields[1];
      const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      if (field4X && field4Y && field4Color) {
        channels.x = field4X.name;
        channels.y = field4Y.name;
        channels.color = field4Color.name;
      } else {
        score = 0;
      }
    }

    return {
      type: t,
      channels,
      score,
    };
  });

  // sort list

  function compareAdvices(chart1: Advice, chart2: Advice) {
    if (chart1.score < chart2.score) {
      return 1;
    } else if (chart1.score > chart2.score) {
      return -1;
    } else {
      return 0;
    }
  }

  const resultList = list.filter((e) => e.score && e.score !== 0 && translate(e.type)).sort(compareAdvices);

  if (showLog) console.log('🍒🍒🍒🍒🍒🍒 resultList 🍒🍒🍒🍒🍒🍒');
  if (showLog) console.log(resultList);

  return resultList;
}

/**
 * Return Specification list of recommend charts from dataset.
 * @todo rename it as `dataToSpecs` and export it
 */
export function analyze(data: any[], options?: AdvisorOptions, showLog = false): Advice[] {
  if (showLog) console.log('💠💠💠💠💠💠 data 💠💠💠💠💠💠');
  if (showLog) console.log(data);
  if (showLog) console.log('🍯🍯🍯🍯🍯🍯 options 🍯🍯🍯🍯🍯🍯');
  if (showLog) console.log(options);

  const dataProps = dataToDataProps(data);

  if (showLog) console.log('🔶🔶🔶🔶🔶🔶 dataset analysis 🔶🔶🔶🔶🔶🔶');
  if (showLog) console.log(dataProps);

  const adviceList: Advice[] = dataPropsToSpecs(dataProps, options);

  return adviceList;
}

/**
 * Return configs for specific charting library from advice.
 * @beta
 */
export function specToLibConfig(advice: Advice, libraryName: ChartLibrary) {
  const { typeMapping, configMapping } = getMappingForLib(libraryName);
  const { type, channels } = advice;
  console.log('type: ', type);

  const libConfig: any = {};

  if (type && typeMapping[type]) {
    libConfig.type = typeMapping[type];
  }

  const configs: any = {};

  for (const [key, value] of Object.entries(channels)) {
    const configMapForType = configMapping[type];
    if (configMapForType) {
      const channel = configMapForType[key as keyof Channels];
      if (typeof channel === 'string') {
        configs[channel] = value;
      }
    }
  }

  if (libraryName === 'G2Plot') {
    libConfig.configs = configs;
  } else if (libraryName === 'G2') {
    // channels to geometries
    const geometry: GeometryOption = {
      ...configMapping[type]?.geometry,
      position: `${configs.x}${configs.y ? `*${configs.y}` : ''}`,

      // hick code
      color: configs.color ? configs.color : configs.x2,
    };
    libConfig.configs = {
      geometries: [geometry],
    };
  }
  return libConfig;
}
