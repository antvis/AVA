import type { Profile, Schema } from '@antv/ava/browser';
import MetadataTable from './MetadataTable';

/** Show catalog columns or profile observations grouped by model. */
export default function SchemaTable({ result }: { result: Schema | Profile }) {
  if (!result.models.length) return <p className="py-2 text-xs text-ink-2">No models.</p>;

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
                caption={`${model.name} · Source and keys`}
                rows={[{ ...model.tableReference, primaryKey: model.primaryKey, uniqueKeys: model.uniqueKeys }]}
              />
            )}
            {'metrics' in model && Object.keys(model.metrics).length > 0 && (
              <MetadataTable caption={`${model.name} · Statistics`} rows={[model.metrics]} />
            )}
            <MetadataTable caption={`${model.name} · ${model.columns.length} columns`} rows={rows} />
          </section>
        );
      })}
      {'relationships' in result && !!result.relationships?.length && (
        <MetadataTable
          caption="Relationships"
          rows={result.relationships.map((relationship) => ({ ...relationship }))}
        />
      )}
      {'views' in result && !!result.views?.length && (
        <MetadataTable caption="Views" rows={result.views.map((view) => ({ ...view }))} />
      )}
    </div>
  );
}
