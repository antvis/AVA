'use client';

import { useState } from 'react';
import ChatWorkspace from '../ChatWorkspace';
import type { Message, ArtifactDisplay } from '../types';
import useSimulatedStream from './useSimulatedStream';
import { PRESET_MESSAGES } from './mockData';

const artifactDisplay: ArtifactDisplay = {
  columns: [
    { key: 'month', label: 'Month' },
    { key: 'revenue_k', label: 'Revenue ($k)' },
    { key: 'gross_profit_k', label: 'Gross profit ($k)' },
    { key: 'margin_pct', label: 'Margin', suffix: '%' },
  ],
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
