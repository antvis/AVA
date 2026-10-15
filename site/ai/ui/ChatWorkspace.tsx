'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  const [artifact, setArtifact] = useState(activeArtifact);
  const [panelOpen, setPanelOpen] = useState(!!activeArtifact);
  const [artifactTab, setArtifactTab] = useState<ArtifactTab>('chart');
  const onArtifact = useCallback((message: Message) => {
    setArtifact(message.artifact);
    setPanelOpen(true);
  }, []);
  useEffect(() => {
    setArtifact(activeArtifact);
    setPanelOpen(!!activeArtifact);
  }, [activeArtifact]);

  return (
    <main className="mx-[max(12px,calc((100%-1120px)/2))] pb-12 [&_p]:max-w-[520px] [&_p]:text-[14px] [&_p]:leading-[1.7] max-md:[&_p]:text-[13px]">
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
            panelOpen && artifact
              ? 'lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] sm:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]'
              : 'grid-cols-1'
          }`}
        >
          <ChatPanel playback={playback} live={live} onArtifact={onArtifact} onRerun={onReplay} heading={heading} />
          {panelOpen && artifact && (
            <ArtifactPanel
              artifact={artifact}
              live={!!live}
              tab={artifactTab}
              onTabChange={setArtifactTab}
              onClose={() => setPanelOpen(false)}
              display={artifactDisplay}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default ChatWorkspace;
