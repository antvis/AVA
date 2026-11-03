'use client';

import { useTranslations } from 'use-intl';

import { useEffect, useRef, useState } from 'react';
import Link from '../../components/LocaleLink';
import type { LiveChat } from './types';
import AttachmentChip from './AttachmentChip';
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from './constants';

function SemanticEditor({ live, onClose }: { live: LiveChat; onClose: () => void }) {
  const t = useTranslations('DatasetContext');
  const dialog = useRef<HTMLDialogElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() =>
    live.dataset.semantic ? JSON.stringify(live.dataset.semantic, null, 2) : ''
  );
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
    editor.current?.focus();
  }, []);

  async function apply(json: string) {
    setPending(true);
    setError('');
    try {
      await live.onSemanticChange(json);
      onClose();
    } catch (err) {
      const issues = err instanceof Error && 'issues' in err ? err.issues : undefined;
      setError(
        Array.isArray(issues)
          ? issues
              .slice(0, 3)
              .map((issue) => `${issue.path.join('.') || 'JSON'}: ${issue.message}`)
              .join('\n')
          : err instanceof Error
          ? err.message
          : String(err)
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="semantic-title"
      aria-describedby="semantic-description"
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-32px)] max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/40"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void apply(draft);
        }}
      >
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="semantic-title" className="text-lg font-semibold tracking-tight">
                {t('semantics')}
              </h2>
              <div className="mt-1 truncate text-xs text-ink-2" title={live.dataset.name}>
                {t('optional')}
                {live.dataset.name}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              aria-label={t('closeSemantics')}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-2 hover:bg-hover disabled:opacity-40"
            >
              <span aria-hidden="true" className="text-xl">
                ×
              </span>
            </button>
          </div>
          <p id="semantic-description" className="mt-3 text-sm leading-6 text-ink-2">
            {t('defineMetricsExplainFieldsAndDescribeDrill')}
          </p>
        </div>
        <div className="space-y-3 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="semantic-json" className="text-xs font-medium">
              {t('semanticJSON')}
            </label>
            <div className="flex items-center gap-4 text-xs">
              <Link
                href="/documentation/data/semantic/"
                target="_blank"
                rel="noreferrer"
                className="text-ink-2 underline underline-offset-4 hover:text-ink"
              >
                {t('formatGuide')}
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => fileInput.current?.click()}
                className="font-medium underline decoration-[color:var(--color-primary-dark)] underline-offset-4 disabled:opacity-40"
              >
                {t('importJSON')}
              </button>
            </div>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            aria-label={t('importSemanticJSON')}
            className="hidden"
            disabled={pending}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              setError('');
              if (file.size > MAX_UPLOAD_SIZE_BYTES) {
                setError(`Maximum file size is ${MAX_UPLOAD_SIZE_MB} MB.`);
                return;
              }
              setPending(true);
              try {
                setDraft(await file.text());
              } catch {
                setError(t('fileError'));
              } finally {
                setPending(false);
              }
            }}
          />
          <textarea
            ref={editor}
            id="semantic-json"
            spellCheck={false}
            value={draft}
            disabled={pending}
            aria-invalid={!!error}
            aria-describedby={error ? 'semantic-error' : 'semantic-description'}
            onChange={(event) => {
              setDraft(event.target.value);
              setError('');
            }}
            placeholder={JSON.stringify({ description: t('placeholder') }, null, 2)}
            className="h-64 w-full resize-y rounded-xl border border-line bg-field p-3 font-mono text-xs leading-6 outline-none focus:border-[color:var(--color-primary-dark)] focus:ring-2 focus:ring-[color:var(--color-primary)]/25 disabled:opacity-60 sm:h-80"
          />
          {error && (
            <div
              id="semantic-error"
              role="alert"
              className="max-h-28 overflow-auto whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700"
            >
              {error}
            </div>
          )}
          <div className="rounded-lg bg-field px-3 py-2 text-xs leading-5 text-ink-2">
            {t('applyingOrRemovingSemanticsStartsANew')}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
          <div>
            {live.dataset.semantic && (
              <button
                type="button"
                disabled={pending}
                onClick={() => void apply('')}
                className="text-xs text-red-700 underline underline-offset-4 disabled:opacity-40"
              >
                {t('removeSemantics')}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg border border-line px-4 py-2 text-xs hover:bg-hover disabled:opacity-40"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={pending || !draft.trim()}
              className="rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:bg-ink/85 disabled:opacity-40"
            >
              {pending ? t('applying') : t('applySemantics')}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}

export default function DatasetContext({ live }: { live: LiveChat }) {
  const t = useTranslations('DatasetContext');
  const [editing, setEditing] = useState(false);
  const applied = !!live.dataset.semantic;
  return (
    <>
      <div
        className="mb-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2"
        aria-label={t('currentDataset', { name: live.dataset.name, count: live.dataset.rowCount })}
      >
        <div className="min-w-0 max-w-full">
          <AttachmentChip file={live.dataset.name} rowCount={live.dataset.rowCount} />
        </div>
        <button
          type="button"
          disabled={live.busy}
          onClick={() => setEditing(true)}
          aria-haspopup="dialog"
          className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-hover disabled:opacity-40 ${
            applied ? 'bg-[color:var(--color-primary)]/15 text-ink' : 'text-ink-2'
          }`}
        >
          <span aria-hidden="true">{applied ? '✓' : '+'}</span>
          {t('semantics')}
          <span className="text-[11px] text-ink-2">{applied ? t('applied') : t('optional2')}</span>
        </button>
      </div>
      {editing && <SemanticEditor live={live} onClose={() => setEditing(false)} />}
    </>
  );
}
