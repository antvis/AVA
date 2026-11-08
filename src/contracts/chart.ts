/** Tool schemas should use z.toJSONSchema(schema, { io: 'input' }) to describe input before normalization. */
import { z } from 'zod';

const label = z.union([z.string(), z.number()]);
const number = z.number().describe('Finite JSON number; cast numeric strings in the query');
const group = label.optional();
const categoryValue = z.looseObject({ category: label, value: number, group });
const timeValue = z.looseObject({ time: label, value: number, group });
const observations = z.array(categoryValue).min(1);
const treeNode = z.looseObject({
  name: label,
  value: number.nonnegative().optional(),
  get children(): z.ZodOptional<z.ZodArray<typeof treeNode>> {
    return z.array(treeNode).optional();
  },
});
const presentation = {
  title: z.string().optional(),
  theme: z.enum(['default', 'light', 'dark', 'academy']).optional(),
  style: z.record(z.string(), z.unknown()).optional(),
};
const axes = { axisXTitle: z.string().optional(), axisYTitle: z.string().optional() };
const grouped = { stack: z.boolean().optional(), group: z.boolean().optional() };
/** Literal construction preserves the correlation between chartType, type and native data fields. */
function defineChart<T extends string, S extends z.ZodRawShape>(type: T, config: z.ZodObject<S, z.core.$loose>) {
  return z
    .object({
      chartType: z.literal(type),
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
      data: z.array(z.looseObject({ category: label, value: number.nonnegative() })).min(1),
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
      data: z.array(number).min(1),
      binNumber: z.number().int().positive().optional(),
      ...axes,
    })
  ),
  defineChart('boxplot', z.looseObject({ data: observations, ...axes })),
  defineChart('violin', z.looseObject({ data: observations, ...axes })),
  defineChart(
    'radar',
    z.looseObject({
      data: z.array(z.looseObject({ name: label, value: number, group })).min(1),
      align: z.boolean().optional(),
    })
  ),
  defineChart('funnel', z.looseObject({ data: observations })),
  defineChart(
    'waterfall',
    z.looseObject({
      data: z
        .array(
          z.union([
            categoryValue.extend({ isTotal: z.literal(false).optional() }),
            z.looseObject({ category: label, isTotal: z.literal(true), value: number.optional() }),
          ])
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
    })
  ),
  defineChart(
    'venn',
    z.looseObject({
      data: z
        .array(
          z.looseObject({
            sets: z.array(z.string()).min(1),
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
      data: z.array(z.looseObject({ source: label, target: label, value: number.nonnegative() })).min(1),
      nodeAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
    })
  ),
  defineChart('table', z.looseObject({ data: z.array(z.record(z.string(), z.unknown())).min(1) })),
  defineChart(
    'dual-axes',
    z.looseObject({
      categories: z.array(label).min(1),
      series: z
        .array(
          z.looseObject({
            type: z.enum(['column', 'line']),
            axisYTitle: z.string().optional(),
            data: z.array(number).min(1),
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
export type VisualizeResponse = ChartSpec & { html: string };

/**
 * Supported chart types from GPT-Vis
 */
export type ChartType = ChartSpec['chartType'];
