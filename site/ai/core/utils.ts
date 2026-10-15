import type { ModelMessage } from 'ai';

/** Collect successful tools since the last source load, invalidating later failures. */
export function getCompletedToolsSinceLastSource(messages: readonly ModelMessage[]): Set<string> {
  const completed = new Set<string>();

  for (const message of messages) {
    if (message.role !== 'tool') continue;

    for (const part of message.content) {
      if (part.type !== 'tool-result') continue;

      if (part.toolName === 'source') completed.clear();
      completed.delete(part.toolName);

      if (part.output.type !== 'error-text' && part.output.type !== 'error-json') completed.add(part.toolName);
    }
  }

  return completed;
}

/** Check whether any of the named tools returned an error in these messages. */
export function hasFailedTool(messages: readonly ModelMessage[], toolNames: readonly string[]): boolean {
  return messages.some(
    (message) =>
      message.role === 'tool' &&
      message.content.some(
        (part) =>
          part.type === 'tool-result' &&
          toolNames.includes(part.toolName) &&
          (part.output.type === 'error-text' || part.output.type === 'error-json')
      )
  );
}

/** Match a leading slash command in the final message against the available tools. */
export function getRequestedTool<T extends string>(
  messages: readonly ModelMessage[],
  toolNames: readonly T[]
): T | undefined {
  const last = messages[messages.length - 1];
  const content =
    typeof last?.content === 'string'
      ? last.content
      : last?.content
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join(' ') ?? '';
  const token = content.trim().split(/\s/)[0];

  return toolNames.find((name) => token === `/${name}`);
}
