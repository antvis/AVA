'use client';

import { DATASET_PREVIEW_COLUMNS } from '../constants';

import React, { useEffect, useRef, useCallback } from 'react';
import type { Message, LivePlayground, ChatPlayback } from './types';
import StreamText from './StreamText';
import ToolTrace from './ToolTrace';
import AttachmentChip from './AttachmentChip';
import ArtifactChip from './ArtifactChip';
import PromptBar from './PromptBar';
import ResponseLoading from './ResponseLoading';

const ChatPanel: React.FC<{
  onArtifact: (m: Message) => void;
  onRerun?: () => void;
  playback: ChatPlayback;
  heading?: React.ReactNode;
  live?: LivePlayground;
}> = ({ onArtifact, onRerun, playback, heading, live }) => {
  /* Follow new content until the user scrolls away from the bottom;
     scrolling back to the bottom resumes following. */
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const { visible, streamingIdx, finished } = playback;

  const onChatScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 1;
  }, []);

  // Instant updates leave no smooth-scroll animation competing with user input.
  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => {
      const el = scrollRef.current;
      if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
    }, 180);
    return () => window.clearInterval(id);
  }, [finished]);

  // Follow message updates only while the user is at the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [visible, streamingIdx]);

  return (
    <>
      <section
        className={`overflow-hidden flex min-h-0 flex-col ${
          live
            ? 'h-[clamp(520px,calc(100dvh-290px),780px)] max-md:h-[clamp(460px,calc(100dvh-250px),680px)]'
            : 'h-[510px] max-md:h-[460px]'
        }`}
      >
        {heading}

        <div
          ref={scrollRef}
          onScroll={onChatScroll}
          className="soft-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-gradient-to-b from-white to-zinc-50/40"
        >
          {live && visible.length === 0 && (
            <div className="py-12">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-2">
                From data to understanding
              </span>
              <h3 className="mt-4 max-w-sm text-3xl font-semibold leading-tight tracking-tight text-ink">
                What would you like
                <br />
                to discover?
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-6 text-ink-2">
                Start with the sample dataset or upload a CSV, Excel, or JSON file. Choose a question below, or ask your
                own.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  { emoji: '🔎', label: 'Summarize key patterns', prompt: 'Summarize the key patterns in this data' },
                  { emoji: '📈', label: 'Visualize a trend', prompt: 'Visualize the most interesting trend' },
                ].map(({ emoji, label, prompt }) => (
                  <button
                    type="button"
                    key={prompt}
                    disabled={live.busy}
                    onClick={() => (live.ready ? live.onSend(prompt) : live.onConfigure())}
                    className="rounded-xl border border-[color:var(--color-primary)]/40 bg-[color:var(--color-primary)]/10 px-3 py-2 text-left text-xs text-ink hover:bg-[color:var(--color-primary)]/25 disabled:opacity-40"
                  >
                    <span aria-hidden="true" className="mr-1.5">
                      {emoji}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {visible.map((msg, i) => {
            if (msg.role === 'user')
              return (
                <div key={i} className="flex flex-col items-end gap-1.5">
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-zinc-900 text-white text-[13px] leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex max-w-full flex-wrap justify-end gap-1.5">
                      {msg.attachments.map((file, j) => (
                        <AttachmentChip key={file} file={file} animationDelay={j * 80} />
                      ))}
                    </div>
                  )}
                </div>
              );
            return (
              <div key={i} className={live ? 'space-y-2' : 'space-y-3'}>
                {msg.dataset && (
                  <section
                    aria-label="Uploaded dataset"
                    className="overflow-hidden rounded-xl border border-line bg-surface"
                  >
                    <div className="border-b border-line bg-[color:var(--color-primary)]/10 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <span aria-hidden="true">📄</span>
                        <span className="min-w-0 truncate" title={msg.dataset.name}>
                          {msg.dataset.name}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-ink-2" role="status">
                        {msg.dataset.rowCount.toLocaleString()} rows · {msg.dataset.columns.length} columns · Ready for
                        analysis
                      </div>
                    </div>
                    <div className="soft-scroll max-h-56 overflow-auto">
                      <table className="w-full text-left text-xs">
                        <caption className="sr-only">Preview of {msg.dataset.name}</caption>
                        <thead className="bg-field text-ink-2">
                          <tr>
                            {msg.dataset.columns.slice(0, DATASET_PREVIEW_COLUMNS).map((column) => (
                              <th
                                key={column}
                                scope="col"
                                className="max-w-48 truncate px-4 py-2 font-medium"
                                title={column}
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-ink">
                          {msg.dataset.preview.map((row, index) => (
                            <tr key={index} className="border-t border-line">
                              {msg.dataset!.columns.slice(0, DATASET_PREVIEW_COLUMNS).map((column) => {
                                const value = row[column];
                                const text =
                                  value == null
                                    ? '—'
                                    : typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value);
                                return (
                                  <td key={column} className="max-w-48 truncate px-4 py-2" title={text}>
                                    {text}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="border-t border-line px-4 py-2 text-[11px] text-ink-2">
                      Preview: first {msg.dataset.preview.length} rows
                      {msg.dataset.columns.length > DATASET_PREVIEW_COLUMNS
                        ? ` · first ${DATASET_PREVIEW_COLUMNS} columns`
                        : ''}
                      . Analysis uses the full dataset.
                    </div>
                  </section>
                )}
                {msg.parts ? (
                  msg.parts.map((part, partIndex) => {
                    if (part.type === 'text')
                      return part.text.trim() ? (
                        <div key={partIndex} className="text-[13.5px] leading-relaxed text-zinc-700">
                          <StreamText
                            text={part.text.trim()}
                            streaming={streamingIdx === i && partIndex === msg.parts!.length - 1}
                          />
                        </div>
                      ) : null;
                    const step = msg.steps?.find((item) => item.id === part.toolCallId);
                    if (!step) return null;
                    const lastTool = step.id === msg.steps?.[msg.steps.length - 1]?.id;
                    return (
                      <ToolTrace
                        key={partIndex}
                        inline
                        msg={{ ...msg, steps: [step], diffs: lastTool ? msg.diffs : undefined }}
                        live={{ rowsShown: 1, runningRow: step.state === 'running' ? 0 : null }}
                      />
                    );
                  })
                ) : (
                  <>
                    <ToolTrace msg={msg} live={streamingIdx === i ? msg.live : undefined} />
                    <div className="text-[13.5px] leading-relaxed text-zinc-700">
                      <StreamText text={msg.text} streaming={streamingIdx === i && !msg.dataset} />
                    </div>
                  </>
                )}
                {msg.dataset && live && (
                  <div className="space-y-2" aria-label="Suggested questions">
                    {msg.suggestionsLoading ? (
                      <div role="status" className="flex items-center gap-2 text-xs text-ink-2">
                        <span
                          aria-hidden="true"
                          className="h-3 w-3 animate-spin rounded-full border border-line border-t-ink-2"
                        />
                        <span>
                          <span aria-hidden="true">🔎 </span>Finding questions in your data…
                        </span>
                      </div>
                    ) : (
                      <>
                        {msg.suggestionsError && (
                          <p role="status" className="text-xs text-ink-2">
                            {msg.suggestionsError}
                          </p>
                        )}
                        {msg.suggestions?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {msg.suggestions.map((question) => (
                              <button
                                key={question}
                                type="button"
                                disabled={live.busy}
                                onClick={() => (live.ready ? live.onSend(question) : live.onConfigure())}
                                className="rounded-xl border border-[color:var(--color-primary)]/40 bg-[color:var(--color-primary)]/10 px-3 py-2 text-left text-xs leading-relaxed text-ink transition-colors hover:bg-[color:var(--color-primary)]/25 disabled:opacity-40"
                              >
                                {question}
                                <span aria-hidden="true" className="ml-1.5">
                                  ↗
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={live.busy}
                            onClick={live.onSuggest}
                            className="text-xs text-ink underline decoration-[color:var(--color-primary-dark)] underline-offset-4 disabled:opacity-40"
                          >
                            {msg.suggestionsError
                              ? 'Retry suggestions'
                              : live.ready
                              ? 'Suggest questions'
                              : 'Configure a model for suggestions'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
                {streamingIdx === i && !msg.dataset && <ResponseLoading />}
                {msg.artifact && streamingIdx !== i && (
                  <ArtifactChip
                    title={msg.artifact.title}
                    description={msg.artifact.description}
                    onOpen={() => onArtifact(msg)}
                  />
                )}
              </div>
            );
          })}
        </div>

        <footer className="shrink-0 border-t border-zinc-50 px-5 pt-4 pb-2">
          {live && (
            <div
              className="mb-2 flex min-w-0"
              aria-label={`Current dataset: ${live.dataset.name}, ${live.dataset.rowCount} rows`}
            >
              <AttachmentChip file={live.dataset.name} rowCount={live.dataset.rowCount} />
            </div>
          )}
          {live?.error && (
            <p role="alert" className="mb-3 text-xs text-red-700">
              {live.error}
            </p>
          )}
          <PromptBar
            placeholder={
              live
                ? 'Ask about your data, or type / for shortcuts…'
                : finished
                ? 'Demo complete — hit ↻ to replay'
                : 'Agent is working…'
            }
            busy={live ? live.busy : true}
            onSend={live?.onSend}
            live={live}
            onRerun={live ? undefined : onRerun}
            replayReady={!live && finished}
          />
        </footer>
      </section>
    </>
  );
};

export default ChatPanel;
