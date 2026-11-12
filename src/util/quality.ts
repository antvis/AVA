import { z } from 'zod';

import { qualityInputSchema } from '../contracts';

import type { JsonValue, Profile, Quality, QualityOptions } from '../types';

type Alert = Quality['models'][number]['alerts'][number];

const correlationMatrix = z.object({ columns: z.array(z.string()), matrix: z.array(z.array(z.number().nullable())) });

function observation(value: JsonValue | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function property(value: JsonValue | undefined, name: string): JsonValue | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value[name] : undefined;
}

export function assessQuality(profile: Profile, options: QualityOptions): Quality {
  const thresholds = qualityInputSchema.parse(options);
  const rules = thresholds.rules && new Set(thresholds.rules);

  return {
    models: profile.models.map(({ name, metrics, columns }) => {
      const alerts: Alert[] = [];
      const add = (alert: Alert) => {
        if (!rules || rules.has(alert.rule)) alerts.push(alert);
      };
      const rows = observation(metrics.row_count) ?? observation(property(metrics.table_summary, 'row_count'));
      if (rows === 0) add({ rule: 'empty', value: 0 });
      const duplicates = observation(property(metrics.row_duplicates, 'group_count'));
      if (duplicates !== undefined && duplicates > 0) add({ rule: 'duplicates', value: duplicates });

      for (const {
        name: column,
        metrics: stats,
        properties: { logicalType, profileType },
      } of columns) {
        const categorical = logicalType === 'string' && (!profileType || profileType === 'Categorical');
        const compare = (rule: Alert['rule'], value: number | undefined, threshold: number) => {
          if (value !== undefined && value > threshold) add({ rule, column, value, threshold });
        };
        const nullCount = observation(stats.null_count);
        const nanCount = profile.semantics === 'data-profiling' ? 0 : observation(stats.nan_count) ?? 0;
        const missing = rows && nullCount !== undefined ? (nullCount + nanCount) / rows : observation(stats.null_ratio);
        compare('missing', missing, thresholds.ratioThreshold);
        if (logicalType === 'unknown') {
          add({ rule: 'unsupported', column });
          continue;
        }

        const distinct = observation(stats.distinct_count);
        if (distinct !== undefined) {
          const values = distinct - Number(nanCount > 0);
          if (values === 1) add({ rule: 'constant', column, value: 1 });
          if (rows && values === rows) add({ rule: 'unique', column, value: values });
          if (categorical) compare('high_cardinality', values, thresholds.cardinalityThreshold);
        }
        compare('zeros', observation(stats.zero_ratio), thresholds.ratioThreshold);
        compare('infinite', observation(stats.infinite_ratio), thresholds.ratioThreshold);
        compare('imbalance', observation(stats.imbalance), thresholds.imbalanceThreshold);
        if (logicalType === 'numeric' || categorical) {
          compare('uniform', observation(property(stats.chi_squared, 'pvalue')), thresholds.uniformThreshold);
        }
        const skewness = observation(stats.skewness);
        if (skewness !== undefined && Math.abs(skewness) > thresholds.skewnessThreshold) {
          add({ rule: 'skewed', column, value: skewness, threshold: thresholds.skewnessThreshold });
        }
      }

      if (!rules || rules.has('high_correlation')) {
        const correlation = correlationMatrix.safeParse(metrics.pearson);
        if (correlation.success) {
          const { columns: names, matrix } = correlation.data;
          for (let i = 0; i < names.length; i += 1) {
            for (let j = i + 1; j < names.length; j += 1) {
              const value = matrix[i]?.[j];
              if (value != null && Math.abs(value) >= thresholds.correlationThreshold) {
                add({
                  rule: 'high_correlation',
                  column: names[i],
                  relatedColumn: names[j],
                  value,
                  threshold: thresholds.correlationThreshold,
                });
              }
            }
          }
        }
      }

      return { name, alerts: alerts.sort((a, b) => a.rule.localeCompare(b.rule)) };
    }),
  };
}
