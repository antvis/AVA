'use client';
import ToolRow from './ToolRow';
import SchemaTable from './SchemaTable';
import MetadataTable from './MetadataTable';
import type { Message } from './types';

export default function RecordedTool({ tool, onOpen }: { tool: NonNullable<Message['recordedTool']>; onOpen?: () => void }) {
  const result = tool.output;
  return <ToolRow icon={tool.name === 'analyze' || tool.name === 'python' ? 'run' : 'read'} label={tool.label} chip={tool.chip} mono running={false} onActivate={onOpen}>
    <span className="text-[11px] font-medium text-ink-2">工具输入</span>
    <pre className="whitespace-pre-wrap break-all text-[11px] leading-5 text-ink-2">{JSON.stringify(tool.input, null, 2)}</pre>
    {tool.name === 'source' && result && <MetadataTable rows={[result]} />}
    {(tool.name === 'schema' || tool.name === 'profile') && result?.models && <SchemaTable result={result as Parameters<typeof SchemaTable>[0]['result']} />}
    <span className={`mt-2 text-[11px] font-medium ${tool.failed ? 'text-red-700' : 'text-ink-2'}`}>完整返回值</span>
    <pre className="whitespace-pre-wrap break-all text-[11px] leading-5 text-ink-2">{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>
  </ToolRow>;
}
