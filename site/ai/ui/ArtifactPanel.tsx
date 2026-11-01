'use client';

import GPTVisRenderer from '../../components/GPTVisRenderer';
import CodePreview from './CodePreview';
import { resultTables } from './utils';
import MetadataTable from './MetadataTable';
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
  const hasChart = !!artifact.config;
  const activeTab = (tab === 'chart' && !hasChart) || (tab === 'sql' && !artifact.code) ? 'data' : tab;
  const tables = resultTables(artifact.data ?? []);
  const report = artifact.report;
  const tabs: ArtifactTab[] = (
    report ? (['data', 'sql', 'chart'] as const) : (['chart', 'data', 'sql'] as const)
  ).filter((t) => (t !== 'chart' || hasChart) && (t !== 'sql' || !!artifact.code));
  const panelId = `${artifact.id}-view`;

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
      {!report && (
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
      )}
      <div className="soft-scroll flex-1 min-h-0 overflow-y-auto p-5">
        {report && (
          <dl className="space-y-3 border-b border-zinc-100 pb-4">
            <div className="flex items-baseline gap-2.5">
              <dt className="shrink-0 font-mono text-[13px] font-semibold text-zinc-400">Q:</dt>
              <dd className="text-[13px] leading-relaxed text-zinc-600">{report.question}</dd>
            </div>
            <div className="flex items-baseline gap-2.5">
              <dt className="shrink-0 font-mono text-[13px] font-semibold text-[#3d8ba3]">A:</dt>
              <dd className="text-[14px] font-medium leading-relaxed text-zinc-800">{report.answer}</dd>
            </div>
          </dl>
        )}
        <div
          role="tablist"
          aria-label="Artifact views"
          className="sticky -top-5 z-10 mb-4 flex items-center gap-1 border-b border-zinc-100 bg-white py-2"
        >
          {tabs.map((t) => (
            <button
              key={t}
              id={`${artifact.id}-${t}-tab`}
              role="tab"
              aria-selected={activeTab === t}
              aria-controls={panelId}
              tabIndex={activeTab === t ? 0 : -1}
              onClick={() => onTabChange(t)}
              onKeyDown={(event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                const index = tabs.indexOf(t);
                const nextIndex =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                    ? tabs.length - 1
                    : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
                onTabChange(tabs[nextIndex]);
                event.currentTarget.parentElement
                  ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                  [nextIndex]?.focus();
              }}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                activeTab === t ? 'bg-[#edf6fa] text-[#347c94]' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {t === 'sql' ? (live ? 'JavaScript' : 'SQL') : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div id={panelId} role="tabpanel" aria-labelledby={`${artifact.id}-${activeTab}-tab`} tabIndex={0}>
          {activeTab === 'chart' && (
            <div className="h-[320px]" role="img" aria-label={artifact.description}>
              <GPTVisRenderer config={artifact.config ?? {}} />
            </div>
          )}
          {activeTab === 'data' &&
            (tables ? (
              tables.map(({ name, rows }, tableIndex) => (
                <section key={name ?? tableIndex} className="mb-5 last:mb-0">
                  {name && <h3 className="mb-2 text-xs font-semibold text-zinc-700">{name}</h3>}
                  <MetadataTable
                    variant="result"
                    caption={name ?? 'Query results'}
                    rows={rows}
                    columns={display?.columns}
                  />
                </section>
              ))
            ) : (
              <CodePreview code={JSON.stringify(artifact.data ?? [], null, 2)} language="json" />
            ))}
          {activeTab === 'sql' && (
            <CodePreview code={artifact.code ?? 'No query generated yet.'} language={live ? 'javascript' : 'sql'} />
          )}
        </div>
        {report && (
          <div className="mt-5 space-y-4 border-t border-zinc-100 pt-4">
            <section>
              <h3 className="text-[12px] font-semibold text-[#347c94]">Insight</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{report.insight}</p>
            </section>
            <section>
              <h3 className="text-[12px] font-semibold text-zinc-500">Limitations</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">{report.limitations}</p>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
