'use client';

import { useTranslations } from 'use-intl';

import type { Profile, Schema } from '@antv/ava/browser';
import MetadataTable from './MetadataTable';

/** Show catalog columns or profile observations grouped by model. */
export default function SchemaTable({ result }: { result: Schema | Profile }) {
  const t = useTranslations('SchemaTable');
  if (!result.models.length) return <p className="py-2 text-xs text-ink-2">{t('noModels')}</p>;

  return (
    <div className="min-w-0 space-y-3">
      {result.models.map((model) => {
        const rows = model.columns.map((column) => {
          if (!('metrics' in column)) return { ...column };
          const { metrics, ...metadata } = column;
          return {
            ...metadata,
            ...Object.fromEntries(Object.entries(metrics).map(([key, value]) => [`metrics.${key}`, value])),
          };
        });
        return (
          <section key={model.name}>
            {'tableReference' in model && (
              <MetadataTable
                caption={t('sourceKeys', { name: model.name })}
                rows={[{ ...model.tableReference, primaryKey: model.primaryKey, uniqueKeys: model.uniqueKeys }]}
              />
            )}
            {'metrics' in model && Object.keys(model.metrics).length > 0 && (
              <MetadataTable caption={t('statistics', { name: model.name })} rows={[model.metrics]} />
            )}
            <MetadataTable caption={t('columns', { name: model.name, count: model.columns.length })} rows={rows} />
          </section>
        );
      })}
      {'relationships' in result && !!result.relationships?.length && (
        <MetadataTable
          caption={t('relationships')}
          rows={result.relationships.map((relationship) => ({ ...relationship }))}
        />
      )}
      {'views' in result && !!result.views?.length && (
        <MetadataTable caption={t('views')} rows={result.views.map((view) => ({ ...view }))} />
      )}
    </div>
  );
}
