import type { Profile, Schema } from '@antv/ava/browser';
import MetadataTable from './MetadataTable';

/** Show schema fields and profile metrics grouped by source table. */
export default function SchemaTable({ result }: { result: Schema | Profile }) {
  if (!result.tables.length) return <p className="py-2 text-xs text-ink-2">No tables.</p>;

  return (
    <div className="min-w-0 space-y-3">
      {result.tables.map((table) => {
        const rows = table.fields.map((field) => {
          if (!('metrics' in field)) return { ...field };

          const { metrics, ...metadata } = field;
          return {
            ...metadata,
            ...Object.fromEntries(Object.entries(metrics).map(([key, value]) => [`metrics.${key}`, value])),
          };
        });

        return (
          <section key={table.name}>
            {'metrics' in table && Object.keys(table.metrics).length > 0 && (
              <MetadataTable caption={`${table.name} · Statistics`} rows={[table.metrics]} />
            )}
            <MetadataTable caption={`${table.name} · ${table.columnCount} fields`} rows={rows} />
            {table.indexes.length > 0 && (
              <MetadataTable caption={`${table.name} · Indexes`} rows={table.indexes.map((index) => ({ ...index }))} />
            )}
          </section>
        );
      })}
      {!!result.relations?.length && (
        <MetadataTable caption="Relations" rows={result.relations.map((relation) => ({ ...relation }))} />
      )}
    </div>
  );
}
