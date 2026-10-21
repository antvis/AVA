export function escapeMarkdown(value: string): string {
  return value
    .replace(/[&<>\\|`*_[\]]/g, (character) => `&#${character.charCodeAt(0)};`)
    .replace(/\r\n|\r|\n/g, '<br>');
}

/** Use the union of row keys as headers, preserving their first-seen order. */
export function markdownTable(rows: object[]): string {
  const headers = [...new Set(rows.reduce<string[]>((keys, row) => [...keys, ...Object.keys(row)], []))];
  if (!headers.length) return '';

  const line = (values: unknown[]) =>
    `| ${values
      .map((value) => escapeMarkdown(typeof value === 'string' ? value : JSON.stringify(value) ?? ''))
      .join(' | ')} |`;

  return [
    line(headers),
    line(headers.map(() => '---')),
    ...rows.map((row) => line(headers.map((key) => (row as Record<string, unknown>)[key]))),
  ].join('\n');
}
