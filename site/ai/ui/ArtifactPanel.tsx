'use client';

import GPTVisRenderer from '../../components/GPTVisRenderer';
import CodePreview from './CodePreview';
import { formatResultValue, resultColumns, resultTables } from './utils';
import type { Message, ArtifactDisplay, ArtifactTab } from './types';

export default function ArtifactPanel({
  artifact,
  live,
  tab,
  onTabChange,
  onClose,
  display,
}: {
  artifact: NonNullable<Message['artifact']>;
  live: boolean;
  tab: ArtifactTab;
  onTabChange: (tab: ArtifactTab) => void;
  onClose: () => void;
  display?: ArtifactDisplay;
}) {
  const hasChart = !!artifact.syntax?.trim();
  const activeTab = tab === 'chart' && !hasChart ? 'data' : tab;
  const tables = resultTables(artifact.data ?? []);
  return (
    <section
      className={`overflow-hidden flex flex-col ${
        live
          ? 'h-[clamp(520px,calc(100dvh-290px),780px)] max-md:h-[clamp(460px,calc(100dvh-250px),680px)]'
          : 'h-[510px] max-md:h-[460px]'
      } border border-[rgb(242,242,237)] rounded-xl shadow-xs`}
      style={{ animation: 'slide-in .4s ease-out' }}
      aria-label="Artifact panel"
    >
      <header className="flex items-center gap-2 px-4 py-2 border-b border-zinc-100">
        <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-zinc-800 font-mono">{artifact.title}</p>
        <button
          onClick={onClose}
          className="shrink-0 flex size-6 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-1 border-b border-zinc-100 px-3 py-1.5">
          {(['chart', 'data', 'sql'] as const)
            .filter((t) => t !== 'chart' || hasChart)
            .map((t) => (
              <button
                key={t}
                onClick={() => onTabChange(t)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  activeTab === t ? 'bg-zinc-100 text-zinc-800' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {t === 'sql' ? (live ? 'JavaScript' : 'SQL') : t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
        </div>
        <div className="soft-scroll flex-1 min-h-0 overflow-y-auto p-5">
          {activeTab === 'chart' && (
            <>
              {display?.chartHeader}
              <div className="h-[320px]" role="img" aria-label={artifact.description}>
                <GPTVisRenderer syntax={artifact.syntax ?? ''} />
              </div>
              {display?.chartFooter}
            </>
          )}
          {activeTab === 'data' &&
            tables.map(({ name, rows }, tableIndex) => {
              const columns: NonNullable<ArtifactDisplay['columns']> =
                display?.columns ?? resultColumns(rows).map((key) => ({ key, label: key }));
              return (
                <section key={name ?? tableIndex} className="mb-5 last:mb-0">
                  {name && <h3 className="mb-2 text-xs font-semibold text-zinc-700">{name}</h3>}
                  {rows.length === 0 ? (
                    <p className="text-xs text-zinc-400">No rows.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12px] tabular-nums">
                        <caption className="sr-only">{name ?? 'Query results'}</caption>
                        <thead>
                          <tr className="border-b border-zinc-100 text-zinc-400">
                            {columns.map((column) => (
                              <th key={column.key} scope="col" className="py-1.5 pr-3 font-medium">
                                {column.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, index) => (
                            <tr key={index} className="border-b border-zinc-50 text-zinc-700">
                              {columns.map((column) => (
                                <td
                                  key={column.key}
                                  className="max-w-sm whitespace-pre-wrap break-words py-1.5 pr-3 align-top"
                                >
                                  {formatResultValue(row[column.key])}
                                  {column.suffix ?? ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}
          {activeTab === 'sql' && (
            <CodePreview code={artifact.code ?? 'No query generated yet.'} language={live ? 'javascript' : 'sql'} />
          )}
        </div>
      </div>
    </section>
  );
}
