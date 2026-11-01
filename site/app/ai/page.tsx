'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LLMConfig } from '@antv/ava/browser';
import ModelConfig from '../../ai/ui/ModelConfig';
import ChatWorkspace from '../../ai/ui/ChatWorkspace';
import SkillSetup from '../../ai/ui/SkillSetup';
import { MAX_UPLOAD_SIZE_MB } from '../../ai/ui/constants';
import useChat from '../../ai/ui/useChat';
import { Header, Footer } from '../../components';
import PageShell from '../../components/PageShell';
import { DEFAULT_LLM_CONFIG, loadLLMConfig, saveLLMConfig } from '../../components/utils';

export default function AIPage() {
  const [config, setConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);
  const [localConfigOpen, setLocalConfigOpen] = useState(false);
  const chat = useChat({ config, onConfigure: () => setLocalConfigOpen(true) });
  const activeArtifact = [...chat.messages].reverse().find((message) => message.artifact)?.artifact;
  useEffect(() => {
    setConfig(loadLLMConfig());
  }, []);
  return (
    <PageShell>
      <Header />
      <div className="relative isolate pt-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse at 8% 12%, color-mix(in srgb, var(--color-primary) 28%, transparent), transparent 55%), radial-gradient(ellipse at 95% 72%, color-mix(in srgb, var(--color-primary-light) 45%, transparent), transparent 58%)',
          }}
        />
        <div className="mx-[max(12px,calc((100%-1120px)/2))] mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Explore your data with AVA</h1>
          <div className="mt-3 grid gap-3 border-t border-line/70 pt-3 text-xs leading-5 text-ink-2 sm:grid-cols-2 sm:gap-8">
            <p>
              Analyze the sample data or upload your own CSV, Excel (.xlsx), or JSON file (up to {MAX_UPLOAD_SIZE_MB}{' '}
              MB). Follow each step to inspect the code, charts, and results.
            </p>
            <div>
              <p className="font-medium text-ink">Need SQL, Python, Parquet, or database connections?</p>
              <nav aria-label="Full AVA capabilities" className="flex flex-wrap items-baseline gap-x-2">
                <span>Use AVA through the</span>
                <a
                  href="#ai-skill-title"
                  className="text-ink underline decoration-[color:var(--color-primary-dark)] underline-offset-4 hover:decoration-ink"
                >
                  Agent Skill
                </a>
                <span aria-hidden="true">·</span>
                <Link
                  href="/documentation/reference/cli/"
                  className="text-ink underline decoration-[color:var(--color-primary-dark)] underline-offset-4 hover:decoration-ink"
                >
                  CLI
                </Link>
                <span>or</span>
                <Link
                  href="/documentation/quickstart/"
                  className="text-ink underline decoration-[color:var(--color-primary-dark)] underline-offset-4 hover:decoration-ink"
                >
                  SDK
                </Link>
              </nav>
            </div>
          </div>
        </div>
        <ChatWorkspace
          live={chat}
          activeArtifact={activeArtifact}
          playback={{
            visible: chat.messages,
            streamingIdx: chat.busy ? chat.messages.length - 1 : null,
            finished: !chat.busy,
          }}
        />
      </div>
      <ModelConfig
        isOpen={localConfigOpen}
        onClose={() => {
          setLocalConfigOpen(false);
        }}
        config={config}
        disabled={chat.busy}
        onSave={(value) => {
          saveLLMConfig(value);
          setConfig(value);
        }}
      />
      <SkillSetup />
      <Footer />
    </PageShell>
  );
}
