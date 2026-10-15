import Link from 'next/link';
import CopyCode from '../../components/docs/CopyCode';

import { INSTALL_COMMANDS, INSTALL_PROMPT } from '../constants';

export default function SkillSetup() {
  return (
    <section aria-labelledby="playground-skill-title" className="bg-surface px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-[1040px] items-start gap-10 md:grid-cols-[1fr_1.1fr] md:gap-16">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">AVA Agent Skill</span>
          <h2 id="playground-skill-title" className="mt-4 text-3xl leading-tight text-ink md:text-4xl">
            Give your agent
            <br />
            visual analytics.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-ink-2">
            Install the AVA Skill to work with your own files and databases. Your agent plans the analysis; AVA runs the
            queries and renders the charts.
          </p>
          <p className="mt-3 max-w-md text-xs leading-6 text-ink-2">
            The core workflow uses your agent’s existing model. No separate AVA model key is required.
          </p>
          <div className="mt-7">
            <CopyCode
              label="Copy install prompt"
              text={INSTALL_PROMPT}
              className="inline-flex items-center gap-3 rounded-xl bg-[color:var(--color-primary)] px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-[color:var(--color-primary-dark)]"
            />
            <p className="mt-3 text-xs leading-5 text-ink-2">
              Paste into your terminal-based AI agent. It will check your environment, install AVA, and verify the
              setup.
            </p>
          </div>
          <Link
            href="/documentation/agent-skill/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink underline decoration-[color:var(--color-primary-dark)] underline-offset-4 hover:decoration-2"
          >
            Read the Skill guide <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-ink">01 · Install the CLI and Skill</h3>
            <CopyCode
              label="Copy commands"
              text={INSTALL_COMMANDS}
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-ink-2 transition-colors hover:bg-hover hover:text-ink"
            />
          </div>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-7 text-[color:var(--color-primary-light)]">
            <code>{INSTALL_COMMANDS}</code>
          </pre>
          <p className="mt-3 text-xs leading-5 text-ink-3">macOS or Linux · Node.js 22.13+ · CLI + project Skill</p>
          <div className="mt-6 border-t border-line pt-6">
            <h3 className="text-sm font-semibold text-ink">02 · Start a new agent session</h3>
            <p className="mt-3 rounded-xl bg-[color:var(--color-primary)]/10 p-4 text-sm leading-6 text-ink">
              “Use the AVA skill to analyze ./sales.csv. Compare sales by region and save a chart. Include the query and
              results table so I can verify the analysis.”
            </p>
          </div>
          <details className="mt-5 text-xs text-ink-2">
            <summary className="cursor-pointer py-1 hover:text-ink">Preview the install prompt</summary>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-field p-3 text-[11px] leading-5">
              <code>{INSTALL_PROMPT}</code>
            </pre>
          </details>
        </div>
      </div>
    </section>
  );
}
