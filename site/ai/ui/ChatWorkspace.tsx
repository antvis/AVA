'use client';

import { useTranslations } from 'use-intl';

import React, { useState } from 'react';
import ChatPanel from './ChatPanel';
import ArtifactPanel from './ArtifactPanel';
import type { Message, LiveChat, ChatPlayback, ArtifactDisplay, ArtifactTab } from './types';

const ChatWorkspace: React.FC<{
  playback: ChatPlayback;
  activeArtifact?: Message['artifact'];
  live?: LiveChat;
  onReplay?: () => void;
  heading?: React.ReactNode;
  artifactDisplay?: ArtifactDisplay;
}> = ({ playback, activeArtifact, live, onReplay, heading, artifactDisplay }) => {
  const t = useTranslations('ChatWorkspace');
  const needsModel = !!live && !live.ready;
  const latestId = activeArtifact?.id;
  const [selection, setSelection] = useState<{ latestId?: string; selectedId: string | null }>({ selectedId: null });
  const [artifactTab, setArtifactTab] = useState<ArtifactTab>('chart');
  const selectedId = selection.latestId === latestId ? selection.selectedId : latestId;
  const artifact = selectedId
    ? selectedId === latestId
      ? activeArtifact
      : playback.visible.find((message) => message.artifact?.id === selectedId)?.artifact
    : undefined;

  function onArtifact(message: Message) {
    setSelection({ latestId, selectedId: message.artifact?.id ?? null });
  }

  return (
    <main
      className={`pb-12 [&_p]:max-w-[520px] [&_p]:text-[14px] [&_p]:leading-[1.7] max-md:[&_p]:text-[13px] ${
        live
          ? 'mx-[max(16px,calc((100%-1240px)/2))] 2xl:mx-[max(20px,calc((100%-1320px)/2))]'
          : 'mx-[max(12px,calc((100%-1120px)/2))]'
      }`}
    >
      <div
        id="ai"
        style={{
          background:
            'linear-gradient(var(--color-surface), var(--color-surface)) padding-box, linear-gradient(125deg, var(--color-primary-light), var(--color-line) 55%, var(--color-primary)) border-box',
        }}
        className="relative scroll-mt-24 overflow-hidden rounded-[25px] max-md:rounded-[18px] border-2 border-transparent shadow-[0_16px_45px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
      >
        <div
          inert={needsModel}
          aria-hidden={needsModel || undefined}
          className={`grid gap-4 p-3 max-md:p-1 transition-all duration-500 ${
            artifact
              ? 'lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] sm:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]'
              : 'grid-cols-1'
          }`}
        >
          <ChatPanel playback={playback} live={live} onArtifact={onArtifact} onRerun={onReplay} heading={heading} />
          {artifact && (
            <ArtifactPanel
              key={artifact.id}
              artifact={artifact}
              live={!!live}
              tab={artifactTab}
              onTabChange={setArtifactTab}
              onClose={() => setSelection({ latestId, selectedId: null })}
              display={artifactDisplay}
            />
          )}
        </div>
        {needsModel && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 px-6 py-10 backdrop-blur-[5px]">
            <section
              aria-labelledby="model-setup-title"
              className="w-full max-w-[400px] rounded-[24px] border border-white bg-white/95 px-7 py-8 text-center shadow-[0_16px_60px_-20px_#578da840]"
            >
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9f2fa] bg-[#eefaff] text-[#4393ac]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="6" y="8" width="12" height="13" rx="3" />
                  <path d="M9 8V5a3 3 0 0 1 6 0v3M12 13v3" />
                </svg>
              </div>
              <h2
                id="model-setup-title"
                className="text-[27px] font-semibold leading-tight tracking-[-0.035em] text-ink"
              >
                {t('connectYourModel')}
                <br />
                {t('startExploring')}
              </h2>
              <p className="mx-auto mt-3 text-ink-2">{t('configureAModelAndAPIKeyTo')}</p>
              <button
                type="button"
                onClick={live?.onConfigure}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-[color:var(--color-primary)] px-5 text-sm font-medium text-ink transition-colors hover:bg-[color:var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--color-primary-dark)]"
              >
                {t('configureModel')}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default ChatWorkspace;
