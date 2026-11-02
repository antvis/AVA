'use client';

import { useLocale, useTranslations } from 'use-intl';
import type { Locale } from '../../../lib/i18n';
import { useMemo, useState } from 'react';
import ChatWorkspace from '../ChatWorkspace';
import type { Message, ArtifactDisplay } from '../types';
import useSimulatedStream from './useSimulatedStream';
import { getDemoMessages } from './mockData';

const artifactDisplay: ArtifactDisplay = {
  columns: [
    { key: 'month', label: 'Month' },
    { key: 'revenue_k', label: 'Revenue ($k)' },
    { key: 'gross_profit_k', label: 'Gross profit ($k)' },
    { key: 'margin_pct', label: 'Margin', suffix: '%' },
  ],
};

export default function DemoChat() {
  const locale = useLocale() as Locale;
  const t = useTranslations('Demo');
  const messages = useMemo(() => getDemoMessages(locale), [locale]);
  const [replayKey, setReplayKey] = useState(0);
  const [activeArtifact, setActiveArtifact] = useState<Message | null>(null);
  const playback = useSimulatedStream(messages, setActiveArtifact, replayKey);
  return (
    <ChatWorkspace
      key={replayKey}
      playback={playback}
      activeArtifact={activeArtifact?.artifact}
      artifactDisplay={
        locale === 'en'
          ? artifactDisplay
          : {
              columns: artifactDisplay.columns!.map((column, i) => ({
                ...column,
                label: t(['month', 'revenue', 'profit', 'marginColumn'][i]),
              })),
            }
      }
      onReplay={() => {
        setActiveArtifact(null);
        setReplayKey((key) => key + 1);
      }}
    />
  );
}
