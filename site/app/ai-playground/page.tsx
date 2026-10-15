'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LLMConfig } from '@antv/ava/browser';
import ModelConfig from '../../ai/ui/ModelConfig';
import ChatWorkspace from '../../ai/ui/ChatWorkspace';
import SkillSetup from '../../ai/ui/SkillSetup';
import { MAX_UPLOAD_SIZE_MB } from '../../ai/constants';
import usePlaygroundChat from '../../ai/ui/usePlaygroundChat';
import { Header, Footer } from '../../components';
import PageShell from '../../components/PageShell';
import { DEFAULT_LLM_CONFIG, loadLLMConfig, saveLLMConfig } from '../../components/utils';

export default function AIPlaygroundPage() {
  const [config, setConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);
  const [localConfigOpen, setLocalConfigOpen] = useState(false);
  const chat = usePlaygroundChat({ config, onConfigure: () => setLocalConfigOpen(true) });
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
              <span className="font-medium text-ink">In this browser demo</span>
              <br />
              <button
                type="button"
                disabled={chat.busy}
                onClick={() => setLocalConfigOpen(true)}
                className="inline-flex items-center gap-1 align-baseline font-medium text-ink underline decoration-[color:var(--color-primary-dark)] underline-offset-4 hover:decoration-ink disabled:opacity-40"
              >
                <svg
                  aria-hidden="true"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9.5 3-.5 2a7 7 0 0 0-2 1.2L5 5.6 2.5 10l1.5 1.4a7 7 0 0 0 0 2.2L2.5 15 5 19.4l2-.6A7 7 0 0 0 9 20l.5 2h5l.5-2a7 7 0 0 0 2-1.2l2 .6 2.5-4.4-1.5-1.4a7 7 0 0 0 0-2.2l1.5-1.4L19 5.6l-2 .6A7 7 0 0 0 15 5l-.5-2z" />
                  <circle cx="12" cy="12.5" r="3" />
                </svg>
                Configure your model
              </button>{' '}
              to analyze the sample data or upload your own CSV, Excel (.xlsx), or JSON file (up to {MAX_UPLOAD_SIZE_MB}{' '}
              MB). Follow each step to inspect the code, charts, and results.
            </p>
            <div>
              <p className="font-medium text-ink">Need SQL, Python, Parquet, or database connections?</p>
              <nav aria-label="Full AVA capabilities" className="flex flex-wrap items-baseline gap-x-2">
                <span>Use AVA through the</span>
                <a
                  href="#playground-skill-title"
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
