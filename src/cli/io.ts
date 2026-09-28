import { createReadStream } from 'fs';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';

/** Bound every input form and decode UTF-8 across stream chunk boundaries. */
export async function readText(value: string): Promise<string> {
  const limit = 16 * 1024 * 1024;

  if (value !== '-' && !value.startsWith('@')) {
    if (Buffer.byteLength(value) > limit) throw new Error('Input exceeds 16 MiB.');
    return value;
  }

  const input = value === '-' ? process.stdin : createReadStream(value.slice(1));
  input.setEncoding('utf8');
  const chunks: string[] = [];
  let bytes = 0;

  for await (const chunk of input) {
    const text = chunk.toString();
    bytes += Buffer.byteLength(text);
    if (bytes > limit) throw new Error('Input exceeds 16 MiB.');
    chunks.push(text);
  }

  return chunks.join('');
}

export async function readJSON(value: string): Promise<unknown> {
  try {
    return JSON.parse(await readText(value));
  } catch (error) {
    throw new Error(`Cannot read JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function writeHTML(path: string | undefined, html: string): Promise<{ output: string }> {
  if (!path?.trim()) throw new Error('--output is required.');

  const output = resolve(path);
  await writeFile(output, html, { flag: 'wx' });

  return { output };
}
