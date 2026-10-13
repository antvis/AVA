import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import ts from 'typescript';

const site = new URL('../', import.meta.url).pathname;
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
  const slug = relative(join(site, 'content/docs'), source).replace(/\.mdx$/, '');
  const route = slug === 'introduction' ? '/documentation/' : `/documentation/${slug}/`;
  const html = await readFile(join(site, 'out', route, 'index.html'), 'utf8');
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${route}: one page title`);
  assert.equal(
    [...html.matchAll(/aria-label="Copy Markdown"/g)].length,
    1,
    `${route}: one page-level Markdown copy control`
  );
  assert.ok(html.includes(`href="https://ava.antv.vision${route}"`), `${route}: canonical URL`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${route}: unique anchors`);
  assert.ok(!/ava\.load\(/.test(html), `${route}: no obsolete public load API`);
  pages.set(route, { html, ids: new Set(ids) });
}

let links = 0;
const linkedPages = new Map(pages);
linkedPages.set('/', { html: await readFile(join(site, 'out/index.html'), 'utf8') });
for (const [route, { html }] of linkedPages) {
  for (const [, href] of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const url = new URL(href.replaceAll('&amp;', '&'), `https://ava.antv.vision${route}`);
    if (url.origin !== 'https://ava.antv.vision' || !url.pathname.startsWith('/documentation')) continue;
    const target = pages.get(`${url.pathname.replace(/\/$/, '')}/`);
    assert.ok(target, `${route}: missing chapter ${url.pathname}`);
    if (url.hash) assert.ok(target.ids.has(decodeURIComponent(url.hash.slice(1))), `${route}: missing anchor ${href}`);
    links++;
  }
}
const quickstart = pages.get('/documentation/quickstart/').html;
assert.ok(quickstart.includes('data-rehype-pretty-code-figure'), 'Code has build-time highlighting');
assert.ok(quickstart.includes('aria-label="Copy code"'), 'Code has a copy control');
assert.ok(quickstart.replace(/<[^>]+>/g, '').includes('npm install @antv/ava@alpha'), 'Install targets the v4 alpha');
console.log(
  `Verified ${pages.size} static MDX pages, ${links} documentation links, anchors, metadata, and code blocks.`
);
