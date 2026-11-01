'use client';

import { useState } from 'react';
import ChatWorkspace from '../ChatWorkspace';
import type { Message, ArtifactDisplay } from '../types';
import useSimulatedStream from './useSimulatedStream';
import { PRESET_MESSAGES } from './mockData';

const artifactDisplay: ArtifactDisplay = {
  chartOnly: true,
  chartFooter: (
    <p className="mt-3 rounded-lg border border-orange-100 bg-orange-50/60 px-3 py-2 text-[12px] leading-relaxed text-zinc-700">
      <strong className="font-semibold text-orange-800">July is the inflection point.</strong> Revenue rose while gross
      profit fell. Review discounts, product mix and unit costs.
    </p>
  ),
};

export default function DemoChat() {
  const [replayKey, setReplayKey] = useState(0);
  const [activeArtifact, setActiveArtifact] = useState<Message | null>(null);
  const playback = useSimulatedStream(PRESET_MESSAGES, setActiveArtifact, replayKey);
  return (
    <ChatWorkspace
      key={replayKey}
      playback={playback}
      activeArtifact={activeArtifact?.artifact}
      artifactDisplay={artifactDisplay}
      onReplay={() => {
        setActiveArtifact(null);
        setReplayKey((key) => key + 1);
      }}
    />
  );
}
