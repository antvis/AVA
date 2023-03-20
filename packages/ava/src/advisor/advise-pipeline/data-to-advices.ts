import { hexToColor, colorToHex, paletteGeneration, colorSimulation } from '@antv/smart-color';

import { computeScore } from '../ruler/utils';
import { deepMix } from '../utils';
import { CHART_IDS } from '../../ckb';
import { getSpecWithEncodeType } from '../utils/inferDataType';

import { getChartTypeSpec } from './spec-mapping';

import type { SimulationType } from '@antv/smart-color';
import type { ColorSchemeType } from '@antv/color-schema';
import type { CkbTypes } from '../../ckb';
import type { Specification, Data } from '../../common/types';
import type { BasicDataPropertyForAdvice, DesignRuleModule, RuleModule } from '../ruler/types';
import type {
  AdvisorOptions,
  Theme,
  SmartColorOptions,
  ScoringResultForChartType,
  ScoringResultForRule,
  Advice,
  AdviseResult,
} from '../types';

/**
 * options for advising inner pipeline
 */
type PipeAdvisorOptions = AdvisorOptions;
declare type ChartID = (typeof CHART_IDS)[number];

/**
 * Run all rules for a given chart type, get scoring result.
 *
 * @param chartType chart ID to be score
 * @param dataProps data props of the input data
 * @param ruleBase rule base
 * @param options
 * @returns
 */
function scoreRules(
  chartType: ChartID | string,
  chartWIKI: CkbTypes.ChartKnowledgeBase,
  dataProps: BasicDataPropertyForAdvice[],
  ruleBase: Record<string, RuleModule>,
  options?: PipeAdvisorOptions
): ScoringResultForChartType {
  const purpose = options ? options.purpose : '';
  const preferences = options ? options.preferences : undefined;

  // for log
  const log: ScoringResultForRule[] = [];

  const info = { dataProps, chartType, purpose, preferences };

  const hardScore = computeScore(chartType, chartWIKI, ruleBase, 'HARD', info, log);

  // Hard-Rule pruning
  if (hardScore === 0) {
    const result: ScoringResultForChartType = { chartType, score: 0, log };
    return result;
  }

  const softScore = computeScore(chartType, chartWIKI, ruleBase, 'SOFT', info, log);

  const score = hardScore * softScore;

  const result: ScoringResultForChartType = { chartType, score, log };

  return result;
}

function applyDesignRules(
  chartType: string,
  dataProps: BasicDataPropertyForAdvice[],
  ruleBase: Record<string, RuleModule>,
  chartSpec: Specification
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
const DEFAULT_COLOR = '#678ef2';

function applyTheme(dataProps: BasicDataPropertyForAdvice[], chartSpec: Specification, theme: Theme) {
  const specWithEncodeType = getSpecWithEncodeType(chartSpec);
  const { primaryColor } = theme;
  const layerEnc = specWithEncodeType.encode;
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
        scale: {
          color: { range: palette.colors.map((color) => colorToHex(color)) },
        },
      };
    }
    return {
      style: {
        fill: colorToHex(color),
      },
    };
  }
  return {};
}

function applySmartColor(
  dataProps: BasicDataPropertyForAdvice[],
  chartSpec: Specification,
  primaryColor: string,
  colorType: ColorSchemeType,
  simulationType: SimulationType
) {
  const specWithEncodeType = getSpecWithEncodeType(chartSpec);
  const layerEnc = specWithEncodeType.encode;
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
        scale: {
          color: {
            range: palette.colors.map((color) => {
              return colorToHex(simulationType ? colorSimulation(color, simulationType) : color);
            }),
          },
        },
      };
    }
    return {
      style: {
        fill: colorToHex(color),
      },
    };
  }
  return {};
}

/**
 * recommending charts given data and dataProps, based on CKB and RuleBase
 *
 * @param data input data [ {a: xxx, b: xxx}, ... ]
 * @param dataProps data props derived from data-wizard or customized by users
 * @param chartWIKI ckb
 * @param ruleBase rule base
 * @param smartColor switch smart color on/off, optional props, default is off
 * @param options options for advising such as log, preferences
 * @param colorOptions color options, optional props, @see {@link SmartColorOptions}
 * @returns chart list [ { type: chartTypes, spec: antv-spec, score: >0 }, ... ]
 */
export function dataToAdvices(
  data: Data,
  dataProps: BasicDataPropertyForAdvice[],
  chartWIKI: Record<string, CkbTypes.ChartKnowledge>,
  ruleBase: Record<string, RuleModule>,
  smartColor?: boolean,
  options?: PipeAdvisorOptions,
  colorOptions?: SmartColorOptions
): AdviseResult {
  /**
   * `refine`: whether to apply design rules
   */
  const enableRefine = options?.refine === undefined ? false : options.refine;
  /**
   * `smartColorOn`: switch SmartColor on/off
   */
  const smartColorOn = smartColor;
  /**
   * `theme`: custom theme
   */
  const theme = options?.theme;
  /**
   * `requireSpec`: only consider chart type with spec if true
   */
  const requireSpec = options?.requireSpec === undefined ? true : options.requireSpec;
  /**
   * customized CKB input or default CKB from @antv/ckb
   */
  const ChartWIKI = chartWIKI;
  /**
   * all charts that can be recommended
   * */
  const CHART_ID_OPTIONS = Object.keys(ChartWIKI);

  const log: ScoringResultForChartType[] = [];
  // score every possible chart
  const list: Advice[] = CHART_ID_OPTIONS.map((t: string) => {
    // step 1: analyze score by rule
    const resultForChartType = scoreRules(t, ChartWIKI, dataProps, ruleBase, options);
    log.push(resultForChartType);

    const { score } = resultForChartType;

    // Zero-Score pruning
    if (score <= 0) {
      return { type: t, spec: null, score };
    }

    // step 2: field mapping to spec encoding
    const chartTypeSpec = getChartTypeSpec(t, data, dataProps, chartWIKI[t]);

    // FIXME kpi_panel and table spec to be null temporarily
    const customChartType = ['kpi_panel', 'table'];
    if (!customChartType.includes(t) && !chartTypeSpec) return { type: t, spec: null, score };

    // step 3: apply design rules
    if (chartTypeSpec && enableRefine) {
      const partEncSpec = applyDesignRules(t, dataProps, ruleBase, chartTypeSpec);
      deepMix(chartTypeSpec, partEncSpec);
    }

    // step 4: custom theme
    if (chartTypeSpec) {
      if (theme && !smartColorOn) {
        const partEncSpec = applyTheme(dataProps, chartTypeSpec, theme);
        deepMix(chartTypeSpec, partEncSpec);
      } else if (smartColorOn) {
        /**
         * `colorTheme`: theme for SmartColor
         * Default color is blue
         */
        const colorTheme = colorOptions?.themeColor ?? DEFAULT_COLOR;
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
        deepMix(chartTypeSpec, partEncSpec);
      }
    }

    return { type: t, spec: chartTypeSpec, score };
  });

  /** compare two advice charts by their score */
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
  const isAvailableAdvice = (advice: Advice) => {
    return advice.score > 0 && (requireSpec ? advice.spec : true);
  };
  const resultList = list.filter(isAvailableAdvice).sort(compareAdvices);

  const result = {
    advices: resultList,
    log,
  };

  return result;
}
