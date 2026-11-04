import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const site = fileURLToPath(new URL('../', import.meta.url));
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? files(path) : path;
      })
    )
  ).flat();
}

const sources = (await files(join(site, 'content/docs'))).filter((path) => path.endsWith('.mdx'));
const sourceText = (await Promise.all(sources.map((path) => readFile(path, 'utf8')))).join('\n');
const semantic = await readFile(join(site, 'content/docs/en/data/semantic.mdx'), 'utf8');
const schemaGuide = await readFile(join(site, 'content/docs/en/data/schema.mdx'), 'utf8');
const orderTable = semantic.match(/\| order_id \|[\s\S]*?(?=\n\n)/)?.[0];
assert.ok(orderTable, 'Semantic guide starts with a concrete order table');
assert.ok(schemaGuide.includes(orderTable), 'Schema and semantic guides use the same order table');
const api = await readFile(join(site, '../src/ava.ts'), 'utf8');
const methods = [...api.matchAll(/^  async (\w+)\(/gm)].map((match) => match[1]);
for (const method of methods) {
  assert.ok(sourceText.includes(`${method}(`), `Public API ${method} is documented`);
}
// Catch newly added public option fields that have no parameter-table entry.
const types = ts.createSourceFile(
  'types.ts',
  await readFile(join(site, '../src/types.ts'), 'utf8'),
  ts.ScriptTarget.Latest,
  true
);
const inputTypes = new Set([
  'AVAConfig',
  'LLMConfig',
  'DuckDBEngineOptions',
  'PythonEngineOptions',
  'AnalysisConfig',
  'ExecutionOptions',
  'ProfileOptions',
  'ChartSpec',
  'CSVReadOptions',
  'CSVSourceOptions',
  'CSVFileSourceOptions',
  'JsonSourceOptions',
  'JsonFileSourceOptions',
  'ParquetSourceOptions',
  'ExcelSourceOptions',
  'TextSourceOptions',
  'SSHOptions',
  'MySQLSourceOptions',
  'PostgreSQLSourceOptions',
  'SQLiteSourceOptions',
  'MongoDBSourceOptions',
  'SupabaseSourceOptions',
]);
const tableFields = new Set(
  [...sourceText.matchAll(/^\| `([^`]+)`\s*\|/gm)].map((match) => match[1].split('.').at(-1))
);
for (const declaration of types.statements) {
  if (!ts.isInterfaceDeclaration(declaration) || !inputTypes.has(declaration.name.text)) continue;
  for (const member of declaration.members) {
    if (ts.isPropertySignature(member)) {
      assert.ok(
        tableFields.has(member.name.getText(types)),
        `${declaration.name.text}.${member.name.getText(types)} has a parameter-table entry`
      );
    }
  }
}
const pages = new Map();
for (const source of sources) {
  const [locale, ...segments] = relative(join(site, 'content/docs'), source)
    .split(sep)
    .join('/')
    .replace(/\.mdx$/, '')
    .split('/');
  const slug = segments.join('/');
  const prefix = locale === 'zh' ? '/zh' : '';
  const route = slug === 'introduction' ? `${prefix}/documentation/` : `${prefix}/documentation/${slug}/`;
  const html = await readFile(join(site, 'out', route, 'index.html'), 'utf8');
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${route}: one page title`);
  assert.ok(
    !/<p(?:\s[^>]*)?>(?:(?!<\/p>)[\s\S])*?<p(?:\s|>)/.test(html),
    `${route}: no nested paragraphs that cause hydration errors`
  );
  assert.ok(!/<span(?:\s[^>]*)?>\s*<p(?:\s|>)/.test(html), `${route}: no paragraphs inside inline labels`);
  assert.equal(
    [...html.matchAll(locale === 'zh' ? /aria-label="复制 Markdown"/g : /aria-label="Copy Markdown"/g)].length,
    1,
    `${route}: one page-level Markdown copy control`
  );
  assert.ok(html.includes(`href="https://ava.antv.vision${route}"`), `${route}: canonical URL`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${route}: unique anchors`);
  assert.ok(!/ava\.load\(/.test(html), `${route}: no obsolete public load API`);
  assert.ok(html.includes(`<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}"`), `${route}: document language`);
  assert.ok(html.includes('hrefLang="zh-CN"') || html.includes('hreflang="zh-CN"'), `${route}: language alternates`);
  pages.set(route, { html, ids: new Set(ids) });
}

let links = 0;
const linkedPages = new Map(pages);
for (const route of ['/', '/ai/', '/zh/', '/zh/ai/']) {
  linkedPages.set(route, { html: await readFile(join(site, 'out', route, 'index.html'), 'utf8') });
}
for (const [route, { html }] of linkedPages) {
  for (const [, href] of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const url = new URL(href.replaceAll('&amp;', '&'), `https://ava.antv.vision${route}`);
    if (url.origin !== 'https://ava.antv.vision' || !/^\/(?:zh\/)?documentation(?:\/|$)/.test(url.pathname)) continue;
    const target = pages.get(`${url.pathname.replace(/\/$/, '')}/`);
    assert.ok(target, `${route}: missing chapter ${url.pathname}`);
    if (url.hash) assert.ok(target.ids.has(decodeURIComponent(url.hash.slice(1))), `${route}: missing anchor ${href}`);
    links++;
  }
}
const quickstart = pages.get('/documentation/quickstart/').html;
assert.ok(quickstart.includes('data-rehype-pretty-code-figure'), 'Code has build-time highlighting');
assert.ok(quickstart.includes('aria-label="Copy code"'), 'Code has a copy control');
assert.ok(quickstart.replace(/<[^>]+>/g, '').includes('npm install @antv/ava@4'), 'Install targets AVA 4.x');
console.log(
  `Verified ${pages.size} static MDX pages, ${links} documentation links, anchors, metadata, and code blocks.`
);

const englishSlugs = sources
  .filter((path) => path.includes(`${sep}en${sep}`))
  .map((path) => relative(join(site, 'content/docs/en'), path))
  .sort();
const chineseSlugs = sources
  .filter((path) => path.includes(`${sep}zh${sep}`))
  .map((path) => relative(join(site, 'content/docs/zh'), path))
  .sort();
assert.deepEqual(chineseSlugs, englishSlugs, 'Both languages cover the same chapters');
for (const [route, { html }] of linkedPages) {
  if (!route.startsWith('/zh/')) continue;
  assert.ok(html.includes('<html lang="zh-CN"'), `${route}: Chinese HTML at build time`);
  assert.ok(html.includes('rel="canonical" href="https://ava.antv.vision' + route + '"'), `${route}: canonical URL`);
  for (const [link, href] of html.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const url = new URL(href, `https://ava.antv.vision${route}`);
    if (url.origin !== 'https://ava.antv.vision') continue;
    const path = url.pathname;
    if (path === '/' || /^\/(ai|documentation)(\/|$)/.test(path))
      assert.ok(link.includes('aria-label="Switch to English"'), `${route}: link lost Chinese locale: ${href}`);
  }
}
const enMessages = JSON.parse(await readFile(join(site, 'messages/en.json'), 'utf8'));
const zhMessages = JSON.parse(await readFile(join(site, 'messages/zh.json'), 'utf8'));
function messageKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, entry]) =>
    typeof entry === 'string' ? [`${prefix}${key}`] : messageKeys(entry, `${prefix}${key}.`)
  );
}
assert.deepEqual(messageKeys(zhMessages).sort(), messageKeys(enMessages).sort(), 'Translation keys stay synchronized');
console.log('Verified bilingual HTML, route coverage, navigation, and message keys.');
