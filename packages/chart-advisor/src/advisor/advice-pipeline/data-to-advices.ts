import { ChartID, ChartKnowledgeJSON } from '@antv/ckb';
import { AntVSpec } from '@antv/antv-spec';
import { hexToColor, colorToHex, paletteGeneration, colorSimulation, SimulationType } from '@antv/smart-color';
import { ColorSchemeType } from '@antv/color-schema';
import { BasicDataPropertyForAdvice, ChartRuleModule, DesignRuleModule, RuleModule } from '../../ruler/concepts/rule';
import { deepMix } from '../utils';
import { Advice, AdvisorOptions, DataRows, Theme, SmartColorOptions } from './interface';
import { getChartTypeSpec } from './spec-mapping';
import { defaultWeight } from './default-weight';

/**
 *
 * @param chartType chart ID to be score
 * @param dataProps data props of the input data
 * @param ruleBase rule base
 * @param options
 * @returns
 */
const scoreRules = (
  chartType: ChartID | string,
  dataProps: BasicDataPropertyForAdvice[],
  ruleBase: Record<string, RuleModule>,
  options?: AdvisorOptions
) => {
  const showLog = options?.showLog;
  const purpose = options ? options.purpose : '';
  const preferences = options ? options.preferences : undefined;

  // for log
  const record: Record<string, any>[] = [];
  const info = { dataProps, chartType, purpose, preferences };
  let hardScore = 1;
  Object.values(ruleBase)
    .filter((r: RuleModule) => r.type === 'HARD' && r.trigger(info) && !ruleBase[r.id].option?.off)
    .forEach((hr: RuleModule) => {
      const weight = ruleBase[hr.id].option?.weight || defaultWeight[hr.id] || 1;
      const score = weight * ((hr as ChartRuleModule).validator(info) as number);
      hardScore *= score;
      record.push({ name: hr.id, score, hard: true });
    });

  let softScore = 0;
  Object.values(ruleBase)
    .filter((r: RuleModule) => r.type === 'SOFT' && r.trigger(info) && !ruleBase[r.id].option?.off)
    .forEach((sr: RuleModule) => {
      const weight = ruleBase[sr.id].option?.weight || defaultWeight[sr.id] || 1;
      const score = weight * ((sr as ChartRuleModule).validator(info) as number);
      softScore += score;
      record.push({ name: sr.id, score, hard: false });
    });
  // const score = hardScore * 100 * (softFullScore ? softScore / softFullScore : 0);
  const score = hardScore * (1 + softScore);

  // eslint-disable-next-line no-console
  if (showLog) console.log('💯score: ', score, '=', hardScore, '* (1 +', softScore, ') ;charttype: ', chartType);
  // eslint-disable-next-line no-console
  if (showLog) console.log(record);
  return score;
};

function applyDesignRules(
  chartType: string,
  dataProps: BasicDataPropertyForAdvice[],
  ruleBase: Record<string, RuleModule>,
  chartSpec: AntVSpec
) {
  const toCheckRules = Object.values(ruleBase).filter(
    (rule: RuleModule) =>
      rule.type === 'DESIGN' && rule.trigger({ dataProps, chartType }) && !ruleBase[rule.id].option?.off
  );
  const encodingSpec = toCheckRules.reduce((lastSpec, rule: RuleModule) => {
    const relatedSpec = (rule as DesignRuleModule).optimizer(dataProps, chartSpec);
    return deepMix(lastSpec, relatedSpec);
  }, {});
  return encodingSpec;
}

const DISCRETE_PALETTE_TYPES = ['monochromatic', 'analogous'] as const;
const CATEGORICAL_PALETTE_TYPES = ['polychromatic', 'split-complementary', 'triadic', 'tetradic'] as const;
const defaultColor = '#678ef2';

function applyTheme(dataProps: BasicDataPropertyForAdvice[], chartSpec: AntVSpec, theme: Theme) {
  const { primaryColor } = theme;
  const layerEnc = 'encoding' in chartSpec.layer[0] ? chartSpec.layer[0].encoding : null;
  if (primaryColor && layerEnc) {
    // convert primary color
    const color = hexToColor(primaryColor);
    // if color is specified
    if (layerEnc.color) {
      const { type, field } = layerEnc.color;
      let colorScheme;
      if (type === 'quantitative') {
        colorScheme = DISCRETE_PALETTE_TYPES[Math.floor(Math.random() * DISCRETE_PALETTE_TYPES.length)];
      } else {
        colorScheme = CATEGORICAL_PALETTE_TYPES[Math.floor(Math.random() * CATEGORICAL_PALETTE_TYPES.length)];
      }
      const count = dataProps.find((d) => d.name === field)?.count;
      const palette = paletteGeneration(colorScheme, {
        color,
        count,
      });
      return {
        encoding: {
          color: {
            scale: {
              range: palette.colors.map((color) => colorToHex(color)),
            },
          },
        },
      };
    }
    return {
      mark: {
        style: {
          color: colorToHex(color),
        },
      },
    };
  }
  return {};
}

function applySmartColor(
  dataProps: BasicDataPropertyForAdvice[],
  chartSpec: AntVSpec,
  primaryColor: string,
  colorType: ColorSchemeType,
  simulationType: SimulationType
) {
  const layerEnc = 'encoding' in chartSpec.layer[0] ? chartSpec.layer[0].encoding : null;
  if (primaryColor && layerEnc) {
    // convert primary color
    const color = hexToColor(primaryColor);
    // if color is specified
    if (layerEnc.color) {
      const { type, field } = layerEnc.color;
      let colorScheme = colorType;
      if (!colorScheme) {
        if (type === 'quantitative') {
          colorScheme = 'monochromatic';
        } else {
          colorScheme = 'polychromatic';
        }
      }
      const count = dataProps.find((d) => d.name === field)?.count;
      const palette = paletteGeneration(colorScheme, {
        color,
        count,
      });
      return {
        encoding: {
          color: {
            scale: {
              range: palette.colors.map((color) => {
                return colorToHex(simulationType ? colorSimulation(color, simulationType) : color);
              }),
            },
          },
        },
      };
    }
    return {
      mark: {
        style: {
          color: colorToHex(color),
        },
      },
    };
  }
  return {};
}

/**
 * recommending charts given data and dataProps, based on CKB and RuleBase
 * @param data input data [ {a: xxx, b: xxx}, ... ]
 * @param dataProps data props derived from data-wizard or customized by users
 * @param chartWIKI ckb
 * @param ruleBase rule base
 * @param options options for advising such as log, preferences
 * @returns chart list [ { type: chartTypes, spec: antv-spec, score: >0 }, ... ]
 */
export function dataToAdvices(
  data: DataRows,
  dataProps: BasicDataPropertyForAdvice[],
  chartWIKI: Record<string, ChartKnowledgeJSON>,
  ruleBase: Record<string, RuleModule>,
  /** SmartColor on/off */
  smartColor?: boolean,
  options?: AdvisorOptions,
  colorOptions?: SmartColorOptions
) {
  /**
   * `refine`: whether to apply design rules
   */
  const enableRefine = options?.refine === undefined ? false : options.refine;
  /**
   * `showLog`: log on/off
   */
  const showLog = options?.showLog;
  /**
   * `smartColorOn`: switch SmartColor on/off
   */
  const smartColorOn = smartColor;
  /**
   * `theme`: custom theme
   */
  const theme = options?.theme;
  /**
   * customized CKB input or default CKB from @antv/ckb
   */
  const ChartWIKI = chartWIKI;
  /**
   * all charts that can be recommended
   * */
  const CHART_ID_OPTIONS = Object.keys(ChartWIKI);

  // score every possible chart
  const list: Advice[] = CHART_ID_OPTIONS.map((t: string) => {
    // step 1: analyze score by rule
    const score = scoreRules(t, dataProps, ruleBase, options);
    if (score <= 0) {
      return { type: t, spec: null, score };
    }

    // step 2: field mapping to spec encoding
    const chartTypeSpec = getChartTypeSpec(t, data, dataProps, chartWIKI[t]);

    // FIXME kpi_panel and table spec to be null temporarily
    const customChartType = ['kpi_panel', 'table'];
    if (!customChartType.includes(t) && !chartTypeSpec) return { type: t, spec: null, score: 0 };

    // step 3: apply design rules
    if (chartTypeSpec && enableRefine) {
      const partEncSpec = applyDesignRules(t, dataProps, ruleBase, chartTypeSpec);
      deepMix(chartTypeSpec.layer[0], partEncSpec);
    }

    // step 4: custom theme
    if (chartTypeSpec) {
      if (theme && !smartColorOn) {
        const partEncSpec = applyTheme(dataProps, chartTypeSpec, theme);
        deepMix(chartTypeSpec.layer[0], partEncSpec);
      } else if (smartColorOn) {
        /**
         * `colorTheme`: theme for SmartColor
         * Default color is blue
         */
        const colorTheme = colorOptions?.themeColor ?? defaultColor;
        /**
         * `colorType`: customize SmartColor generation type
         */
        const colorType = colorOptions?.colorSchemeType;
        /**
         * `simulationType`: customize SmartColor for specific simulation mode
         * Default color mode is normal
         */
        const simulationType = colorOptions?.simulationType;
        const partEncSpec = applySmartColor(dataProps, chartTypeSpec, colorTheme, colorType, simulationType);
        deepMix(chartTypeSpec.layer[0], partEncSpec);
      }
    }

    return { type: t, spec: chartTypeSpec, score };
  });

  /**
   * compare two advice charts by their score
   * @param chart1
   * @param chart2
   * @returns
   */
  function compareAdvices(chart1: Advice, chart2: Advice) {
    if (chart1.score < chart2.score) {
      return 1;
    }
    if (chart1.score > chart2.score) {
      return -1;
    }
    return 0;
  }

  // filter and sorter
  const resultList = list.filter((e) => e.score > 0 && e.spec).sort(compareAdvices);

  // eslint-disable-next-line no-console
  if (showLog) console.log('🍒🍒🍒🍒🍒🍒 resultList 🍒🍒🍒🍒🍒🍒');
  // eslint-disable-next-line no-console
  if (showLog) console.log(resultList);

  return resultList;
}
