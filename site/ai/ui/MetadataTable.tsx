import { formatResultValue, resultColumns } from './utils';

/** Display metadata records with all available columns. */
export default function MetadataTable({ caption, rows }: { caption?: string; rows: Record<string, unknown>[] }) {
  const columns = resultColumns(rows);

  return (
    <div className="soft-scroll max-h-80 overflow-auto">
      <table className="w-full text-left text-[11.5px] tabular-nums">
        {caption && <caption className="py-2 text-left font-medium text-ink">{caption}</caption>}
        <thead>
          <tr className="border-b border-line text-ink-2">
            {columns.map((column) => (
              <th key={column} scope="col" className="whitespace-nowrap py-1.5 pr-4 font-medium">
                {column.replace(/^metrics\./, '').replaceAll('_', ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-line/50 text-ink-2">
              {columns.map((column) => (
                <td key={column} className="max-w-64 whitespace-pre-wrap break-words py-1.5 pr-4 align-top">
                  {formatResultValue(row[column])}
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
