const presetLightColors = {
  colorBase: 'rgba(0, 0, 0, 0.65)',
  colorEntityBase: 'rgba(0, 0, 0, 0.65)',
  colorPositive: '#FA541C',
  colorNegative: '#13A8A8',
  colorConclusion: '#1F0352',
  colorDimensionValue: 'rgba(0, 0, 0, 0.88)',
  colorMetricName: 'rgba(0, 0, 0, 0.88)',
  colorMetricValue: '#1677FF',
  colorOtherValue: 'rgba(0, 0, 0, 0.88)',
  colorProportionShadow: '#CDDDFD',
  colorProportionFill: '#3471F9',
  colorLineStroke: '#5B8FF9',
} as const;

const presetDarkColors = {
  colorBaseDark: 'rgba(255, 255, 255, 0.65)',
  colorEntityBaseDark: 'rgba(255, 255, 255, 0.65)',
  colorPositiveDark: '#FA541C',
  colorNegativeDark: '#13A8A8',
  colorConclusionDark: '#D8C3F3',
  colorDimensionValueDark: 'rgba(255, 255, 255, 0.88)',
  colorMetricNameDark: 'rgba(255, 255, 255, 0.88)',
  colorMetricValueDark: '#4B91FF',
  colorOtherValueDark: 'rgba(255, 255, 255, 0.88)',
  colorProportionShadowDark: '#CDDDFD',
  colorProportionFillDark: '#3471F9',
  colorLineStrokeDark: '#5B8FF9',
} as const;

export const seedToken = {
  ...presetLightColors,
  ...presetDarkColors,

  fontSizeBase: 14,
  fontSizeSmall: 12,

  lineHeightBase: 24,
  lineHeightSmall: 20,
} as const;

export type ColorToken = keyof typeof presetLightColors;
