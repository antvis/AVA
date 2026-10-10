'use client';

import React, { useState } from 'react';
import Reveal from './Reveal';
import { SectionHeading, SectionLink } from './Section';

/* ------------------------------------------------------------------ */
/* Verified examples — commands and code taken from the repository     */
/* README (Quick Start: Skill / CLI / SDK). Do not edit to invent APIs. */
/* ------------------------------------------------------------------ */

type TabId = 'skill' | 'cli' | 'sdk';

const TABS: {
  id: TabId;
  label: string;
  heading: string;
  description: string;
  language: 'bash' | 'typescript';
  docHref: string;
  docLabel: string;
}[] = [
  {
    id: 'skill',
    label: 'Agent Skill',
    heading: 'Give Your Agent a Data Analytics Skill.',
    description:
      'Equip compatible agents with a reusable workflow for exploring, analyzing, and visualizing data — using the agent’s own reasoning, with no separate model key.',
    language: 'bash',
    docHref: 'https://github.com/antvis/AVA/blob/main/skills/ava/SKILL.md',
    docLabel: 'View the AVA Skill',
  },
  {
    id: 'cli',
    label: 'CLI',
    heading: 'Analytics from the Command Line.',
    description:
      'Explore data, execute queries, and generate visualizations directly from your terminal.',
    language: 'bash',
    docHref: 'https://github.com/antvis/AVA#cli',
    docLabel: 'CLI documentation',
  },
  {
    id: 'sdk',
    label: 'SDK',
    heading: 'Build Analytics into Your Application.',
    description:
      'Compose data analysis capabilities directly in your TypeScript applications.',
    language: 'typescript',
    docHref: 'https://ava.antv.vision/documentation',
    docLabel: 'SDK reference',
  },
];

/* ---------------- code renderers (hand-tinted spans) ---------------- */

const SkillCode: React.FC = () => (
  <pre className="overflow-x-auto font-mono text-[12.5px] leading-[1.75] text-zinc-300">
    <code>
      <span className="text-zinc-500">{'# install the skills for your agents'}</span>{'\n'}
      <span className="text-[#89ddff]">{'$ '}</span><span className="text-[#82aaff]">npx</span> skills add antvis/AVA{'\n\n'}
      <span className="text-zinc-500">{'# or add the marketplace in Claude Code'}</span>{'\n'}
      <span className="text-[#89ddff]">{'$ '}</span><span className="text-[#82aaff]">/plugin</span> marketplace add antvis/AVA{'\n\n'}
      <span className="text-zinc-500">{'# then, in a new agent session:'}</span>{'\n'}
      <span className="text-[#c3e88d]">
        &quot;Use the AVA skill to analyze /absolute/path/sales.csv,{'\n'}
        &nbsp;compare sales by region, and generate a chart.&quot;
      </span>
    </code>
  </pre>
);

const CliCode: React.FC = () => (
  <pre className="overflow-x-auto font-mono text-[12.5px] leading-[1.75] text-zinc-300">
    <code>
      <span className="text-zinc-500">{'# install (Node.js 22.13+, macOS / Linux)'}</span>{'\n'}
      <span className="text-[#89ddff]">{'$ '}</span><span className="text-[#82aaff]">npm</span> install -g @antv/ava{'\n\n'}
      <span className="text-[#89ddff]">{'$ '}</span><span className="text-[#82aaff]">ava</span> source sales.csv{'\n'}
      <span className="text-[#89ddff]">{'$ '}</span><span className="text-[#82aaff]">ava</span> suggest &quot;$DATASET_ID&quot; --count 5{'\n'}
      <span className="text-[#89ddff]">{'$ '}</span><span className="text-[#82aaff]">ava</span> analyze &quot;$DATASET_ID&quot; \{'\n'}
      &nbsp;&nbsp;<span className="text-[#f78c6c]">&quot;What is the average sales value by region?&quot;</span>{'\n'}
      <span className="text-[#89ddff]">{'$ '}</span><span className="text-[#82aaff]">ava</span> visualize --query <span className="text-[#f78c6c]">&quot;Compare average sales by region&quot;</span> \{'\n'}
      &nbsp;&nbsp;--data @rows.json --output chart.html{'\n\n'}
      <span className="text-zinc-500">{'# output is JSON · sessions expire after 30 min idle'}</span>
    </code>
  </pre>
);

const SdkCode: React.FC = () => (
  <pre className="overflow-x-auto font-mono text-[12.5px] leading-[1.75] text-zinc-300">
    <code>
      <span className="text-[#c792ea]">import</span> {'{ AVA }'} <span className="text-[#c792ea]">from</span> <span className="text-[#f78c6c]">&apos;@antv/ava&apos;</span>;{'\n\n'}
      <span className="text-[#c792ea]">const</span> ava = <span className="text-[#c792ea]">new</span> <span className="text-[#82aaff]">AVA</span>({'{'}{'\n'}
      &nbsp;&nbsp;llm: {'{'} model: <span className="text-[#f78c6c]">&apos;ling-1t&apos;</span>, apiKey, baseURL {'}'},{'\n'}
      &nbsp;&nbsp;<span className="text-zinc-500">{'// engine: { type: \'duckdb\' } is the default'}</span>{'\n'}
      {'}'});{'\n\n'}
      <span className="text-[#c792ea]">await</span> ava.<span className="text-[#82aaff]">source</span>({'{'} <span className="text-[#f78c6c]">&apos;csv-file&apos;</span>, options: {'{'} path: <span className="text-[#f78c6c]">&apos;data/companies.csv&apos;</span> {'}'} {'}'});{'\n'}
      <span className="text-[#c792ea]">const</span> result = <span className="text-[#c792ea]">await</span> ava.<span className="text-[#82aaff]">analyze</span>(<span className="text-[#f78c6c]">&apos;What is the average revenue by region?&apos;</span>);{'\n'}
      <span className="text-[#c792ea]">const</span> viz = <span className="text-[#c792ea]">await</span> ava.<span className="text-[#82aaff]">visualize</span>(result);{'\n'}
      console.<span className="text-[#82aaff]">log</span>(viz.chartType); <span className="text-zinc-500">{'// e.g. \'column\''}</span>{'\n\n'}
      ava.<span className="text-[#82aaff]">dispose</span>();
    </code>
  </pre>
);

const CODE: Record<TabId, React.FC> = { skill: SkillCode, cli: CliCode, sdk: SdkCode };

const CODE_TEXT: Record<TabId, string> = {
  skill: `# install the skills for your agents
npx skills add antvis/AVA

# or add the marketplace in Claude Code
/plugin marketplace add antvis/AVA

# then, in a new agent session:
"Use the AVA skill to analyze /absolute/path/sales.csv, compare sales by region, and generate a chart."`,
  cli: `# install (Node.js 22.13+, macOS / Linux)
npm install -g @antv/ava

ava source sales.csv
ava suggest "$DATASET_ID" --count 5
ava analyze "$DATASET_ID" \\
  "What is the average sales value by region?"
ava visualize --query "Compare average sales by region" \\
  --data @rows.json --output chart.html

# output is JSON · sessions expire after 30 min idle`,
  sdk: `import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: { model: 'ling-1t', apiKey, baseURL },
  // engine: { type: 'duckdb' } is the default
});

await ava.source({ type: 'csv-file', options: { path: 'data/companies.csv' } });
const result = await ava.analyze('What is the average revenue by region?');
const viz = await ava.visualize(result);
console.log(viz.chartType); // e.g. 'column'

ava.dispose();`,
};

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const Integrate: React.FC<{ id?: string }> = ({ id = 'integrate' }) => {
  const [tab, setTab] = useState<TabId>('skill');
  const [copied, setCopied] = useState(false);
  const [copiedTab, setCopiedTab] = useState<TabId>('skill');
  const active = TABS.find((t) => t.id === tab)!;
  const Code = CODE[tab];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CODE_TEXT[tab]);
      setCopied(true);
      setCopiedTab(tab);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <section id={id} className="relative mx-6 overflow-hidden rounded-[24px] px-6 py-[88px] max-md:mx-2.5 max-md:px-1 max-md:py-14" aria-label="Integrate your way">
      <div aria-hidden className="absolute inset-x-0 top-0 h-full bg-[#f6fbfe]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Developer Experience"
            title="Bring Analytics to Your Agent."
            description="Integrate AVA through an Agent Skill, CLI, or SDK — on your terms."
          />
        </Reveal>

        <Reveal delay={120}>
          <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {/* tab bar */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 pt-3">
              <div role="tablist" aria-label="Integration methods" className="flex gap-1 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative shrink-0 rounded-t-lg px-4 py-2.5 text-[13.5px] font-medium transition-colors ${
                      tab === t.id
                        ? 'text-[color:var(--color-primary-dark)]'
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    {t.label}
                    {tab === t.id && (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 bottom-0 h-[2px] rounded-full"
                        style={{ background: 'var(--color-primary-dark)' }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={copy}
                aria-live="polite"
                className={`mr-1 mb-1 flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11.5px] transition-all ${
                  copied && copiedTab === tab
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                }`}
              >
                {copied && copiedTab === tab ? (
                  <>copied ✓</>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <rect x="9" y="9" width="12" height="12" rx="2" />
                      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                    </svg>
                    copy
                  </>
                )}
              </button>
            </div>

            {/* body */}
            <div className="grid gap-0 md:grid-cols-[2fr_3fr]">
              <div className="min-w-0 p-6">
                <div key={`${tab}-text`} style={{ animation: 'fade-swap 280ms ease-out both' }}>
                  <h3 className="text-[17px] font-semibold leading-snug text-zinc-900">
                    {active.heading}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                    {active.description}
                  </p>
                  <div className="mt-5">
                    <SectionLink href={active.docHref} external>
                      {active.docLabel}
                    </SectionLink>
                  </div>
                </div>
              </div>
              <div className="min-w-0 overflow-hidden border-t border-zinc-100 sm:border-l sm:border-t-0">
                <div className="flex items-center gap-2 bg-[#161e2e] px-4 py-2.5">
                  <span className="flex gap-1.5" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {active.language === 'bash' ? 'bash' : 'agent.ts'}
                  </span>
                </div>
                <div className="bg-[#0d1420] p-4" key={`${tab}-code`} style={{ animation: 'fade-swap 280ms ease-out both' }}>
                  <Code />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Integrate;
