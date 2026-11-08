/** Tool schemas should use z.toJSONSchema(schema, { io: 'input' }) to describe input before normalization. */
import { z } from 'zod';

const label = z.union([z.string(), z.number()]);
const number = z.number().describe('Finite JSON number; cast numeric strings in the query');
const group = z.string().optional();
const categoryValue = z.looseObject({ category: z.string(), value: number, group });
const timeValue = z.looseObject({ time: label, value: number, group });
const observations = z.array(categoryValue).min(1);
const treeNode = z.looseObject({
  name: z.string(),
  value: number.nonnegative(),
  get children(): z.ZodOptional<z.ZodArray<typeof treeNode>> {
    return z.array(treeNode).optional();
  },
});
// Match the pinned GPT-Vis package while retaining its extensible visual attributes.
const attributes = z.record(z.string(), z.unknown());
const style = z.looseObject({
  backgroundColor: z.string().optional(),
  palette: z.array(z.string()).optional(),
  title: attributes.optional(),
  axis: attributes.optional(),
  legend: attributes.optional(),
  label: attributes.optional(),
  mark: z.record(z.string(), attributes).optional(),
  node: attributes.optional(),
  edge: attributes.optional(),
  table: z.record(z.string(), attributes).optional(),
  summary: attributes.optional(),
  texture: z.enum(['rough', 'default']).optional(),
  lineWidth: number.optional(),
  startAtZero: z.boolean().optional(),
});
const tokens = z.looseObject({
  colorDefault: z.string().optional(),
  colorBackground: z.string().optional(),
  colorSurface: z.string().optional(),
  colorText: z.string().optional(),
  colorTextSecondary: z.string().optional(),
  colorTextInverse: z.string().optional(),
  colorStroke: z.string().optional(),
  colorPositive: z.string().optional(),
  colorNegative: z.string().optional(),
  colorNeutral: z.string().optional(),
  category10: z.array(z.string()).optional(),
  category20: z.array(z.string()).optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.union([number, z.enum(['normal', 'bold'])]).optional(),
  fontSize: number.optional(),
  lineHeight: number.optional(),
  spacingSmall: number.optional(),
  spacingMedium: number.optional(),
  lineWidth: number.optional(),
  radius: number.optional(),
});
const themeSpec = z.looseObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  baseTheme: z.string().optional(),
  tokens: tokens.optional(),
  style: style.optional(),
  charts: z.record(z.string(), z.looseObject({ style: style.optional() })).optional(),
});
const theme = z.union([
  z.enum([
    'default',
    'light',
    'dark',
    'academy',
    'gpt-vis',
    'midnight',
    'paper',
    'product',
    'neon-circuit',
    'terra-print',
    'mono-signal',
    'candy-pop',
    'pop',
    'bauhaus',
  ]),
  themeSpec,
]);
const presentation = {
  title: z.string().optional(),
  subtitle: z.string().optional(),
  theme: theme.optional(),
  style: style.optional(),
};
const axes = { axisXTitle: z.string().optional(), axisYTitle: z.string().optional() };
const grouped = { stack: z.boolean().optional(), group: z.boolean().optional() };
/** Literal construction preserves the correlation between chartType, type and native data fields. */
function defineChart<T extends string, S extends z.ZodRawShape>(type: T, config: z.ZodObject<S, z.core.$loose>) {
  return z
    .object({
      chartType: z.literal(type),
      html: z.string().optional(),
      config: config.extend({
        ...presentation,
        type: z
          .literal(type)
          .optional()
          .transform((value) => value ?? type),
      }),
    })
    .strict();
}

const chartSchemas = [
  defineChart('column', z.looseObject({ data: observations, ...axes, ...grouped })),
  defineChart('bar', z.looseObject({ data: observations, ...axes, ...grouped })),
  defineChart('line', z.looseObject({ data: z.array(timeValue).min(1), ...axes })),
  defineChart('area', z.looseObject({ data: z.array(timeValue).min(1), ...axes, stack: z.boolean().optional() })),
  defineChart(
    'pie',
    z.looseObject({
      data: z.array(z.looseObject({ category: z.string(), value: number.nonnegative() })).min(1),
      innerRadius: number.min(0).max(1).optional(),
    })
  ),
  defineChart(
    'scatter',
    z.looseObject({
      data: z.array(z.looseObject({ x: number, y: number, group })).min(1),
      ...axes,
    })
  ),
  defineChart(
    'histogram',
    z.looseObject({
      data: z.array(number).min(1).describe('Raw numeric observations, not pre-binned counts'),
      binNumber: z.number().int().positive().optional(),
      ...axes,
    })
  ),
  defineChart(
    'boxplot',
    z.looseObject({ data: observations.describe('Raw observations; repeat each category'), ...axes })
  ),
  defineChart(
    'violin',
    z.looseObject({ data: observations.describe('Raw observations; repeat each category'), ...axes })
  ),
  defineChart(
    'radar',
    z.looseObject({
      data: z.array(z.looseObject({ name: z.string(), value: number, group })).min(1),
      align: z.boolean().optional(),
    })
  ),
  defineChart(
    'funnel',
    z.looseObject({
      data: observations.describe('Stages in conversion order'),
      conversionRateLabel: z.string().optional(),
    })
  ),
  defineChart(
    'waterfall',
    z.looseObject({
      data: z
        .array(
          z.looseObject({
            category: z.string(),
            value: number.optional(),
            isTotal: z.boolean().optional().describe('Cumulative total; value may be omitted'),
            isIntermediateTotal: z
              .boolean()
              .optional()
              .describe('Subtotal since the previous intermediate total; value may be omitted'),
          })
        )
        .min(1),
      ...axes,
    })
  ),
  defineChart(
    'liquid',
    z.looseObject({
      percent: number.min(0).max(1),
      shape: z.enum(['rect', 'circle', 'pin', 'triangle']).optional(),
    })
  ),
  defineChart(
    'word-cloud',
    z.looseObject({
      data: z.array(z.looseObject({ text: z.string(), value: number })).min(1),
      locale: z.string().optional(),
    })
  ),
  defineChart(
    'venn',
    z.looseObject({
      data: z
        .array(
          z.looseObject({
            sets: z.union([z.array(z.string()).min(1), z.string()]),
            value: number.nonnegative(),
            label: z.string().optional(),
          })
        )
        .min(1),
    })
  ),
  defineChart('treemap', z.looseObject({ data: z.array(treeNode).min(1) })),
  defineChart(
    'sankey',
    z.looseObject({
      data: z.array(z.looseObject({ source: z.string(), target: z.string(), value: number.nonnegative() })).min(1),
      nodeAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
    })
  ),
  defineChart('table', z.looseObject({ data: z.array(z.record(z.string(), z.unknown())).min(1) })),
  defineChart(
    'dual-axes',
    z.looseObject({
      categories: z.array(z.string()).min(1),
      series: z
        .array(
          z.looseObject({
            type: z.enum(['column', 'line']),
            axisYTitle: z.string().optional(),
            data: z.array(number).min(1).describe('One numeric value per category, in the same order'),
          })
        )
        .min(1),
      axisXTitle: z.string().optional(),
    })
  ),
] as const;
export const chartSpecSchema = z.discriminatedUnion('chartType', chartSchemas).superRefine((spec, context) => {
  if (spec.chartType !== 'dual-axes') return;
  const config = spec.config;
  config.series.forEach((series, index) => {
    if (series.data.length !== config.categories.length) {
      context.addIssue({
        code: 'custom',
        path: ['config', 'series', index, 'data'],
        message: 'Series must align with categories',
      });
    }
  });
});

/**
 * Chart specification for rendering.
 */
export type ChartSpec = z.infer<typeof chartSpecSchema>;

/** Standalone chart generation result. */
export type VisualizeResponse = ChartSpec & Required<Pick<ChartSpec, 'html'>>;

/**
 * Supported chart types from GPT-Vis
 */
export type ChartType = ChartSpec['chartType'];

export const bindingSchema = z.union([
  z
    .object({ fields: z.record(z.string(), z.string().min(1)).refine((fields) => Object.keys(fields).length > 0) })
    .strict(),
  z.object({ configField: z.string().min(1) }).strict(),
]);

export type ChartDataBinding = z.infer<typeof bindingSchema>;
