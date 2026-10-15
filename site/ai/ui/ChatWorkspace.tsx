'use client';

import React, { useState } from 'react';
import ChatPanel from './ChatPanel';
import ArtifactPanel from './ArtifactPanel';
import type { Message, LivePlayground, ChatPlayback, ArtifactDisplay, ArtifactTab } from './types';

const ChatWorkspace: React.FC<{
  playback: ChatPlayback;
  activeArtifact?: Message['artifact'];
  live?: LivePlayground;
  onReplay?: () => void;
  heading?: React.ReactNode;
  artifactDisplay?: ArtifactDisplay;
}> = ({ playback, activeArtifact, live, onReplay, heading, artifactDisplay }) => {
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
        live ? 'mx-[max(12px,calc((100%-1320px)/2))]' : 'mx-[max(12px,calc((100%-1120px)/2))]'
      }`}
    >
      <div
        id="playground"
        style={{
          background:
            'linear-gradient(var(--color-surface), var(--color-surface)) padding-box, linear-gradient(125deg, var(--color-primary-light), var(--color-line) 55%, var(--color-primary)) border-box',
        }}
        className="scroll-mt-24 overflow-hidden rounded-[25px] max-md:rounded-[18px] border-2 border-transparent shadow-[0_16px_45px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
      >
        <div
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
      </div>
    </main>
  );
};

export default ChatWorkspace;
