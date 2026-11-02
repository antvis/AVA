// Explicit, one-file ID conversion. Does not list/search the user's files.
// Writes a credential-free source config exclusively; never prints the IDs.
import { open, unlink } from 'node:fs/promises';

const output = process.argv[2];
const encodedId = process.env.TENCENT_DOCS_ENCODED_FILE_ID;
const sheetId = process.env.TENCENT_DOCS_SHEET_ID;
const headers = {
  'Access-Token': process.env.TENCENT_DOCS_ACCESS_TOKEN,
  'Client-Id': process.env.TENCENT_DOCS_CLIENT_ID,
  'Open-Id': process.env.TENCENT_DOCS_OPEN_ID,
  Accept: 'application/json',
};
let handle;
let created = false;
try {
  if (
    !output ||
    !encodedId ||
    !sheetId ||
    !encodedId.trim() ||
    encodedId.length > 256 ||
    !sheetId.trim() ||
    sheetId.length > 256
  ) {
    throw new Error('Missing explicit output path, encoded ID or sheet ID.');
  }
  if (Object.values(headers).some((value) => !value || /[^\x21-\x7e]/.test(value)))
    throw new Error('Invalid OpenAPI credentials.');
  const signal = AbortSignal.timeout(25000);
  const url = new URL('https://docs.qq.com/openapi/drive/v2/util/converter');
  url.searchParams.set('type', '2');
  url.searchParams.set('value', encodedId);
  const response = await fetch(url, { headers, redirect: 'error', signal });
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing body.');
  let bytes = 0;
  const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) throw new Error('Conversion response exceeds limit.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const fileId = body.data?.fileID;
  if (!response.ok || body.ret !== 0 || typeof fileId !== 'string' || !fileId.trim() || fileId.length > 256)
    throw new Error('Conversion rejected.');
  handle = await open(output, 'wx', 0o600);
  created = true;
  await handle.writeFile(JSON.stringify({ type: 'tencent-smartsheet', options: { fileId, sheetId } }, null, 2) + '\n');
  await handle.close();
  handle = undefined;
  console.log('PASS: wrote native-ID source config (no credentials). Keep this local file private.');
} catch {
  await handle?.close().catch(() => undefined);
  if (created) await unlink(output).catch(() => undefined);
  console.error(
    'Conversion failed. Check the explicit IDs, OAuth permissions and output path; existing files are never overwritten.'
  );
  process.exitCode = 1;
}
