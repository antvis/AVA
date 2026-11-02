// Explicit, optional fixture setup. The AVA connector never calls write tools.
import { readFile } from 'node:fs/promises';

import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

if (!process.argv.includes('--seed')) throw new Error('Pass --seed to append eight synthetic orders to a TEST table.');
const { TENCENT_DOCS_TOKEN: token, TENCENT_DOCS_FILE_ID: fileId, TENCENT_DOCS_SHEET_ID: sheetId } = process.env;
if (!token || !fileId || !sheetId)
  throw new Error('Set TENCENT_DOCS_TOKEN, TENCENT_DOCS_FILE_ID and TENCENT_DOCS_SHEET_ID.');
const sales = JSON.parse(await readFile(new URL('./sales.json', import.meta.url), 'utf8'));
const client = new Client({ name: 'ava-tencent-docs-fixture-setup', version: '1.0.0' });

async function call(name, args) {
  const result = await client.callTool({ name, arguments: { file_id: fileId, sheet_id: sheetId, ...args } });
  if (result.isError) throw new Error('Fixture setup tool failed; inspect the test table before retrying.');
  const body = result.structuredContent ?? JSON.parse(result.content.find((item) => item.type === 'text').text);
  if (body.error) throw new Error('Fixture setup API failed; inspect the test table before retrying.');
  return body;
}

try {
  await client.connect(
    new StreamableHTTPClientTransport(new URL('https://docs.qq.com/openapi/mcp'), {
      requestInit: { headers: { Authorization: token }, signal: AbortSignal.timeout(60000) },
    })
  );
  const metadata = await call('smartsheet.list_fields', { offset: 0, limit: 100 });
  for (const [title, type] of [
    ['文本', 'text'],
    ['数字', 'number'],
    ['单选', 'singleSelect'],
    ['日期', 'dateTime'],
  ]) {
    if (!metadata.fields.some((field) => field.field_title === title && field.field_type === type)) {
      throw new Error(
        'Use a dedicated test SmartSheet with 文本/text, 数字/number, 单选/singleSelect and 日期/dateTime.'
      );
    }
  }
  let offset = 0;
  for (;;) {
    const page = await call('smartsheet.list_records', { offset, limit: 100, field_titles: ['文本'] });
    if (
      page.records.some((record) =>
        record.field_values.some(
          (cell) => cell.field === '文本' && cell.text_value?.items?.some((item) => item.text?.startsWith('AVA-DEMO-'))
        )
      )
    )
      throw new Error('AVA-DEMO records already exist. Refusing to append duplicate fixtures.');
    if (!page.has_more) break;
    if (!Number.isInteger(page.next) || page.next <= offset) throw new Error('Invalid pagination.');
    offset = page.next;
    if (offset > 10000) throw new Error('Use a small, dedicated test table.');
  }
  // No automatic retries for writes. A lost response may still have committed.
  await call('smartsheet.add_records', {
    records: sales.map((sale) => ({
      field_values: [
        { field: '文本', text_value: { items: [{ text: sale.文本, type: 'text' }] } },
        { field: '数字', number_value: sale.数字 },
        { field: '单选', option_value: { items: [{ text: sale.单选 }] } },
        { field: '日期', string_value: String(Date.parse(sale.日期)) },
      ],
    })),
  });
  console.log('Appended eight synthetic AVA-DEMO orders. Existing rows were not changed or deleted.');
} catch {
  // SDK errors may contain untrusted upstream responses. Do not print them.
  console.error('Fixture setup failed or fixtures already exist. Check the test table before retrying.');
  process.exitCode = 1;
} finally {
  await client.close();
}
