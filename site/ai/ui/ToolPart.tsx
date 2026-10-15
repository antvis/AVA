'use client';

import { getToolName } from 'ai';
import type { PlaygroundUIMessage } from '../core/session';
import { MAX_TOOL_DETAIL_LENGTH, TOOL_STEPS } from './constants';
import type { Message } from './types';
import ToolTrace from './ToolTrace';
import SchemaTable from './SchemaTable';
import MetadataTable from './MetadataTable';

type ToolMessagePart = Extract<PlaygroundUIMessage['parts'][number], { type: `tool-${string}` | 'dynamic-tool' }>;

/** Render the SDK tool part without copying its execution state. */
export default function ToolPart({
  part,
  active,
  diffs,
  diffLines,
}: { part: ToolMessagePart; active: boolean } & Pick<Message, 'diffs' | 'diffLines'>) {
  const name = getToolName(part);
  const presentation = TOOL_STEPS[name] ?? { icon: 'run', label: name, chip: name, mono: true };
  const pending =
    part.state === 'input-streaming' ||
    part.state === 'input-available' ||
    (part.state === 'output-available' && part.preliminary);
  const status = {
    'input-streaming': 'Preparing',
    'input-available': 'Running',
    'approval-requested': 'Awaiting approval',
    'approval-responded': part.approval?.approved ? 'Approved' : 'Denied',
    'output-available': part.state === 'output-available' && part.preliminary ? 'Receiving result' : 'Completed',
    'output-error': 'Failed',
    'output-denied': 'Denied',
  }[part.state];

  const value =
    part.state === 'output-error'
      ? part.errorText
      : part.state === 'output-denied'
      ? part.approval.reason ?? 'Tool execution was denied.'
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

  return (
    <ToolTrace
      inline
      detail={detail}
      msg={{
        role: 'assistant',
        text: '',
        steps: [
          {
            ...presentation,
            id: part.toolCallId,
            label: part.title ?? presentation.label,
            chip: `${presentation.chip} · ${pending && !active ? 'Interrupted' : status}`,
            detail: detail
              ? []
              : [
                  {
                    text: (typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? '').slice(
                      0,
                      MAX_TOOL_DETAIL_LENGTH
                    ),
                  },
                ],
          },
        ],
        diffs,
        diffLines,
      }}
      live={{ rowsShown: 1, runningRow: pending && active ? 0 : null }}
    />
  );
}
