'use client';

import { useState } from 'react';
import ChatWorkspace from '../ChatWorkspace';
import type { Message, ArtifactDisplay } from '../types';
import useSimulatedStream from './useSimulatedStream';
import { PRESET_MESSAGES, ARTIFACT_METRICS } from './mockData';

const artifactDisplay: ArtifactDisplay = {
  columns: [
    { key: 'month', label: 'Month' },
    { key: 'revenueK', label: 'Revenue ($k)' },
    { key: 'grossProfitK', label: 'Gross profit ($k)' },
    { key: 'marginPct', label: 'Margin (%)', suffix: '%' },
  ],
  chartHeader: (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">Growth quality · Jan–Sep 2026</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">More revenue. Thinner margins.</h3>
      <div className="my-4 grid grid-cols-3 gap-2">
        {ARTIFACT_METRICS.map((metric) => (
          <div key={metric.label} className="border-l-2 border-[color:var(--color-primary-dark)]/30 pl-2">
            <p className="text-[10px] text-zinc-500">{metric.label}</p>
            <p className="my-1 text-xl font-semibold tracking-tight text-zinc-900 tabular-nums">{metric.value}</p>
            <p className="text-[10px] text-zinc-400">{metric.detail}</p>
          </div>
        ))}
      </div>
    </>
  ),
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
