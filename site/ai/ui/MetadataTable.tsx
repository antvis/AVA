import { formatResultValue, resultColumns } from './utils';
import type { ArtifactDisplay } from './types';

/** Render tool metadata or artifact results with shared columns and value formatting. */
export default function MetadataTable({
  caption,
  rows,
  columns: providedColumns,
  variant = 'metadata',
}: {
  caption?: string;
  rows: Record<string, unknown>[];
  columns?: ArtifactDisplay['columns'];
  variant?: 'metadata' | 'result';
}) {
  const isResult = variant === 'result';
  const columns =
    providedColumns ??
    resultColumns(rows).map((key) => ({
      key,
      label: isResult ? key : key.replace(/^metrics\./, '').replaceAll('_', ' '),
      suffix: '',
    }));

  if (isResult && rows.length === 0) return <p className="text-xs text-zinc-400">No rows.</p>;

  return (
    <div className={isResult ? 'overflow-x-auto' : 'soft-scroll max-h-80 overflow-auto'}>
      <table className={`w-full text-left tabular-nums ${isResult ? 'text-[12px]' : 'text-[11.5px]'}`}>
        {caption && (
          <caption className={isResult ? 'sr-only' : 'py-2 text-left font-medium text-ink'}>{caption}</caption>
        )}
        <thead>
          <tr className={isResult ? 'border-b border-zinc-100 text-zinc-400' : 'border-b border-line text-ink-2'}>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`py-1.5 font-medium ${isResult ? 'pr-3' : 'whitespace-nowrap pr-4'}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={isResult ? 'border-b border-zinc-50 text-zinc-700' : 'border-b border-line/50 text-ink-2'}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`whitespace-pre-wrap break-words py-1.5 align-top ${
                    isResult ? 'max-w-sm pr-3' : 'max-w-64 pr-4'
                  }`}
                >
                  {formatResultValue(row[column.key])}
                  {column.suffix ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="py-2 text-xs text-ink-2">No fields.</p>}
    </div>
  );
}
