'use client';

import { useEffect, useState } from 'react';
import ChatWorkspace from './ChatWorkspace';
import Header from '../../components/Header';
import PageShell from '../../components/PageShell';
import type { Message } from './types';

interface Event {
  type: 'text' | 'tool';
  content?: string;
  id?: string;
  name?: string;
  input?: unknown;
  output?: Record<string, any>;
  failed?: boolean;
  origin?: string;
}

interface Episode { question: string; events: Event[] }
export interface RecordedCase {
  id: string;
  label: string;
  mode: 'ava' | 'basic';
  episode: Episode;
  notes: string[];
  screenshots: string[];
  conclusionChart?: Message['inlineChart'];
}
export interface Records { model: string; cases: RecordedCase[] }

const names: Record<string, string> = {
  source: '加载数据', schema: '表结构', profile: '数据概况', semantic: '业务语义', analyze: '分析', visualize: '可视化',
  python: '执行 Python',
};

function display(record: RecordedCase): Message[] {
  const events = record.episode.events.filter((event) => event.type !== 'tool' || !event.failed);
  return [
    { role: 'user', text: record.episode.question, attachments: ['retail.sqlite'] },
    ...events.map((event, i): Message => {
      if (event.type === 'text') return { role: 'assistant', text: event.content || '', ...(i === events.length - 1 && record.conclusionChart ? { inlineChart: record.conclusionChart } : {}) };
      const result = event.output;
      const query = result?.sql ? result : result?.result?.sql ? result.result : undefined;
      const artifact = event.name === 'python' ? {
        id: `${record.id}-${event.id || i}`, title: 'analysis.py', description: 'Python 代码与实际打印输出', codeLanguage: 'python' as const,
        code: String((event.input as { code?: string })?.code || ''), outputText: [result?.stdout, result?.error].filter(Boolean).join('\n'),
      } : !event.failed && (query || result?.config) ? {
        id: `${record.id}-${event.id || i}`,
        title: result?.config ? 'visualization.html' : 'query.sql',
        description: query?.query || String((event.input as { query?: string })?.query || names[event.name || ''] || event.name),
        codeLanguage: 'sql' as const,
        code: query?.sql,
        data: query?.data,
        config: result?.config,
      } : undefined;
      return {
        role: 'assistant', text: '', artifact,
        recordedTool: {
          name: event.name || '', label: names[event.name || ''] || event.name || '',
          chip: `${record.mode === 'ava' ? 'ava.' : ''}${event.name}() · ${event.failed ? '失败' : event.origin === 'saved-result-rendering' ? '图表' : '已完成'}`,
          input: event.input, output: event.output, failed: event.failed,
        },
      };
    }),
  ];
}

export default function RecordsPage({ records }: { records: Records }) {
  const [selected, setSelected] = useState(records.cases[0].id);
  useEffect(() => {
    const select = () => { const id = window.location.hash.slice(1); if (records.cases.some((item) => item.id === id)) setSelected(id); };
    select(); window.addEventListener('hashchange', select);
    return () => window.removeEventListener('hashchange', select);
  }, [records.cases]);
  const record = records.cases.find((item) => item.id === selected) || records.cases[0];
  const messages = display(record);
  const activeArtifact = [...messages].reverse().find((message) => message.artifact)?.artifact;
  return (
    <PageShell>
      <Header />
      <div className="relative isolate pt-6 [&_.max-h-80]:max-h-none [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_[data-streamdown=code-block]]:gap-0 [&_[data-streamdown=code-block]]:p-1 [&_[data-streamdown=code-block]]:rounded-lg [&_[data-streamdown=code-block-body]]:p-2 [&_[data-streamdown=code-block-body]]:border-0 [&_[data-streamdown=code-block]_pre]:leading-[1.45] [&_[data-artifact-panel]_pre]:p-2 [&_[data-artifact-panel]_pre]:leading-[1.45]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 8% 12%, color-mix(in srgb, var(--color-primary) 28%, transparent), transparent 55%), radial-gradient(ellipse at 95% 72%, color-mix(in srgb, var(--color-primary-light) 45%, transparent), transparent 58%)' }} />
        <div className="mx-[max(16px,calc((100%-1240px)/2))] mb-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Playground · 对话记录</h1>
            <a href="/zh/ai/" className="text-xs text-ink-2 underline underline-offset-4">打开实时 Playground ↗</a>
          </div>
          <p className="mt-2 text-xs text-ink-2">{records.model} · 同一份 SQLite 合成数据 · 展示原始问题、回答和成功工具结果。此页读取已保存结果，不调用模型。</p>
          <nav aria-label="选择测试记录" className="mt-4 flex flex-wrap gap-2">
            {records.cases.map((item) => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => { setSelected(item.id); window.history.replaceState(null, '', '#' + item.id); }} className={`rounded-lg border px-3 py-2 text-xs transition-colors ${selected === item.id ? 'border-[color:var(--color-primary-dark)] bg-[color:var(--color-primary)]/25 text-ink' : 'border-line bg-white text-ink-2 hover:bg-hover'}`}>{item.label}</button>)}
          </nav>
        </div>
        <ChatWorkspace key={record.id} recorded activeArtifact={record.conclusionChart ? undefined : activeArtifact} playback={{ visible: messages, streamingIdx: null, finished: true }} heading={<div className="border-b border-line px-5 py-3 text-xs text-ink-2">{record.mode === 'ava' ? 'AVA 工具 + 业务语义' : '仅 Python · 未加载语义 JSON'} · {record.label}</div>} />
        <div className="mx-[max(16px,calc((100%-1240px)/2))] -mt-7 pb-10 text-xs leading-6 text-ink-2">
          <details className="rounded-xl border border-line bg-surface px-4 py-3">
            <summary className="cursor-pointer font-medium text-ink">核验与测试条件（与模型原回答分开）</summary>
            <ul className="mt-2 list-disc pl-5">{record.notes.map((note) => <li key={note}>{note}</li>)}</ul>
            <p className="mt-2">Python 基础工具组直接调用相同 GLM-5.1，仅提供 python，无 AVA SDK、分析流程或语义 JSON；库内 3 个原有 SQL 视图保留，因此视图定义仍可被发现。两题按顺序追问，第二题保留第一题上下文。这是工具能力与语义同时变化的对照，不能单独归因于语义模型。</p>
            <a className="underline underline-offset-4" href="/retail-cases/record.json" download>下载原始 AVA 过程 JSON</a><span> · </span><a className="underline underline-offset-4" href="/retail-cases/basic-record.json" download>下载基础工具过程 JSON</a>
          </details>
          {record.screenshots.length > 0 && <details className="mt-3 rounded-xl border border-line bg-surface px-4 py-3"><summary className="cursor-pointer font-medium text-ink">查看现场截图</summary><div className="mt-3 grid gap-4">{record.screenshots.map((src) => <img key={src} src={src} alt={`${record.label}现场截图`} loading="lazy" className="w-full rounded-lg border border-line" />)}</div></details>}
        </div>
      </div>
    </PageShell>
  );
}
