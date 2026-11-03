'use client';

import { useTranslations } from 'use-intl';

import { lazy, Suspense } from 'react';
import CodePreview from './CodePreview';
import { resultTables } from './utils';
import MetadataTable from './MetadataTable';
import type { Message, ArtifactDisplay, ArtifactTab } from './types';

const GPTVisRenderer = lazy(() => import('../../components/GPTVisRenderer'));

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
  const t = useTranslations('ArtifactPanel');
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
      data-artifact-panel
      className={`overflow-hidden flex flex-col ${
        live
          ? 'h-[clamp(520px,calc(100dvh-290px),780px)] max-md:h-[clamp(460px,calc(100dvh-250px),680px)]'
          : 'h-[560px] max-md:h-[500px]'
      } border border-[rgb(242,242,237)] rounded-xl shadow-xs`}
      style={{ animation: 'slide-in .4s ease-out' }}
      aria-label={t('artifactPanel')}
    >
      {!report && (
        <header className="flex items-center gap-2 px-4 py-2 border-b border-zinc-100">
          <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-zinc-800 font-mono">{artifact.title}</p>
          <button
            onClick={onClose}
            className="shrink-0 flex size-6 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            aria-label={t('closePanel')}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </header>
      )}
      <div className="soft-scroll flex-1 min-h-0 overflow-y-auto p-5">
        {report && (
          <header className="mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#648594]">
              {t('summary')}
            </span>
            <p className="mt-2 text-[15px]! font-medium leading-[1.6]! tracking-[-0.02em] text-[#213c48]">
              {report.answer}
            </p>
          </header>
        )}
        <div
          role="tablist"
          aria-label={t('artifactViews')}
          className={`sticky -top-5 z-10 mb-4 flex items-center gap-1 ${
            report ? 'rounded-[10px] bg-[#edf3f6] p-1' : 'border-b border-zinc-100 bg-white py-2'
          }`}
        >
          {tabs.map((tabId) => (
            <button
              key={tabId}
              id={`${artifact.id}-${tabId}-tab`}
              role="tab"
              aria-selected={activeTab === tabId}
              aria-controls={panelId}
              tabIndex={activeTab === tabId ? 0 : -1}
              onClick={() => onTabChange(tabId)}
              onKeyDown={(event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                const index = tabs.indexOf(tabId);
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
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${report ? 'flex-1' : ''} ${
                activeTab === tabId
                  ? report
                    ? 'bg-white text-[#326b80] shadow-[0_1px_4px_#24475614]'
                    : 'bg-[#edf6fa] text-[#347c94]'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tabId === 'sql' ? (live ? 'JavaScript' : 'SQL') : t(tabId)}
            </button>
          ))}
        </div>
        <div id={panelId} role="tabpanel" aria-labelledby={`${artifact.id}-${activeTab}-tab`} tabIndex={0}>
          {activeTab === 'chart' && (
            <div className="h-[320px]" role="img" aria-label={artifact.description}>
              <Suspense
                fallback={
                  <div role="status" className="flex h-full items-center justify-center text-xs text-zinc-500">
                    {t('loadingChart')}
                  </div>
                }
              >
                <GPTVisRenderer config={artifact.config ?? {}} />
              </Suspense>
            </div>
          )}
          {activeTab === 'data' &&
            (tables ? (
              tables.map(({ name, rows }, tableIndex) => (
                <section key={name ?? tableIndex} className="mb-5 last:mb-0">
                  {name && <h3 className="mb-2 text-xs font-semibold text-zinc-700">{name}</h3>}
                  <MetadataTable
                    variant="result"
                    caption={name ?? t('queryResults')}
                    rows={rows}
                    columns={display?.columns}
                  />
                </section>
              ))
            ) : (
              <CodePreview code={JSON.stringify(artifact.data ?? [], null, 2)} language="json" />
            ))}
          {activeTab === 'sql' && (
            <CodePreview code={artifact.code ?? t('noQueryGeneratedYet')} language={live ? 'javascript' : 'sql'} />
          )}
        </div>
        {report && (
          <p className="mt-4 border-t border-zinc-100 pt-3 text-[11px]! leading-[1.6]! text-zinc-500">
            <span aria-hidden="true">* </span>
            <span className="font-medium">{t('limitations')}: </span>
            {report.limitations}
          </p>
        )}
      </div>
    </section>
  );
}
