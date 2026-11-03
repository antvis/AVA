'use client';

import { useTranslations } from 'use-intl';

import { getToolName } from 'ai';
import type { AIUIMessage } from '../core/session';
import { MAX_TOOL_DETAIL_LENGTH, TOOL_STEPS } from './constants';
import ToolRow from './ToolRow';
import SchemaTable from './SchemaTable';
import MetadataTable from './MetadataTable';

type ToolMessagePart = Extract<AIUIMessage['parts'][number], { type: `tool-${string}` | 'dynamic-tool' }>;

/** Render the SDK tool part without copying its execution state. */
export default function ToolPart({ part, active }: { part: ToolMessagePart; active: boolean }) {
  const t = useTranslations('ToolPart');
  const name = getToolName(part);
  const presentation = TOOL_STEPS[name] ?? { icon: 'run', label: name, chip: name, mono: true };
  const pending =
    part.state === 'input-streaming' ||
    part.state === 'input-available' ||
    (part.state === 'output-available' && part.preliminary);
  const status = {
    'input-streaming': t('preparing'),
    'input-available': t('running'),
    'approval-requested': t('awaitingApproval'),
    'approval-responded': part.approval?.approved ? t('approved') : t('denied'),
    'output-available': part.state === 'output-available' && part.preliminary ? t('receivingResult') : t('completed'),
    'output-error': t('failed'),
    'output-denied': t('denied'),
  }[part.state];

  const value =
    part.state === 'output-error'
      ? part.errorText
      : part.state === 'output-denied'
      ? part.approval.reason ?? t('toolExecutionWasDenied')
      : part.state === 'output-available'
      ? part.output
      : part.input;

  let detail;
  if (part.state === 'output-available') {
    if (part.type === 'tool-source') {
      detail = <MetadataTable rows={[part.output]} />;
    } else if (part.type === 'tool-schema' || part.type === 'tool-profile') {
      detail = <SchemaTable result={part.output} />;
    }
  }

  const running = !!pending && active;

  return (
    <div className="w-full">
      <div className="-mx-1 overflow-hidden px-1.5">
        <ToolRow
          {...presentation}
          label={part.title ?? (name in TOOL_STEPS ? t(name) : name)}
          chip={`${presentation.chip} · ${pending && !active ? t('interrupted') : status}`}
          running={running}
        >
          {detail ?? (
            <span className="truncate text-[11.5px] leading-[1.6] text-ink-2">
              {(typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? '').slice(
                0,
                MAX_TOOL_DETAIL_LENGTH
              )}
            </span>
          )}
        </ToolRow>
      </div>
    </div>
  );
}
