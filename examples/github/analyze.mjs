// Two business questions about a GitHub repository, checked against GitHub's own search.
// Usage: node examples/github/analyze.mjs [owner/name] [--verify-only]
import assert from 'node:assert/strict';

import { AVA } from '../../lib/index.js';

const repository = process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? 'antvis/AVA';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || undefined;
const verifyOnly = process.argv.includes('--verify-only');
if (!verifyOnly && (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL)) {
  throw new Error('Set OPENAI_API_KEY and OPENAI_MODEL, or pass --verify-only for the SQL checks only.');
}

// A finished month keeps the merge time example stable; the backlog is checked as it is now.
const month = { label: '2026 年 10 月', from: '2026-10-01', to: '2026-10-31' };

/** Items matching a GitHub search query, independently of the AVA loader. */
async function search(query, { items = false } = {}) {
  const found = [];
  for (let page = 1; ; page++) {
    const url = `https://api.github.com/search/issues?per_page=100&page=${page}&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': '@antv/ava-example',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const body = await response.json();
    if (!response.ok) throw new Error(`GitHub search failed (${response.status} ${body.message})`);
    if (!items) return body.total_count;
    found.push(...body.items);
    if (found.length >= body.total_count || body.items.length === 0) return found;
  }
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const ava = new AVA({
  llm: {
    model: process.env.OPENAI_MODEL || 'offline-verification',
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    maxRetries: 0,
  },
});

try {
  await ava.source({ type: 'github', options: { repository, token } });

  // Issue backlog: open issues, and those without labels or assignees, as GitHub search counts them.
  const backlog = (
    await ava.query(`SELECT count(*) AS open_issues,
      count(*) FILTER (WHERE len(labels) = 0) AS without_labels,
      count(*) FILTER (WHERE len(assignees) = 0) AS without_assignees
    FROM issues WHERE state = 'open'`)
  ).data[0];
  assert.deepEqual(backlog, {
    open_issues: await search(`repo:${repository} is:issue is:open`),
    without_labels: await search(`repo:${repository} is:issue is:open no:label`),
    without_assignees: await search(`repo:${repository} is:issue is:open no:assignee`),
  });

  // Merge time: pull requests merged in the month, and the median hours from creation to merge.
  const merged = await search(`repo:${repository} is:pr merged:${month.from}..${month.to}`, { items: true });
  const expectedMerges = {
    merged_prs: merged.length,
    median_hours: median(
      merged.map((pull) => (Date.parse(pull.pull_request.merged_at) - Date.parse(pull.created_at)) / 3600000)
    ),
  };
  const merges = (
    await ava.query(`SELECT count(*) AS merged_prs,
      median(date_diff('second', created_at, merged_at)) / 3600 AS median_hours
    FROM pull_requests WHERE merged_at >= TIMESTAMP '${month.from}' AND merged_at < TIMESTAMP '${month.to}' + INTERVAL 1 DAY`)
  ).data[0];
  assert.equal(merges.merged_prs, expectedMerges.merged_prs);
  assert.ok(Math.abs(merges.median_hours - expectedMerges.median_hours) < 1e-6);
  console.log(`PASS: ${repository} tables match GitHub search.`);
  console.table([{ ...backlog, ...merges }]);

  if (!verifyOnly) {
    const questions = [
      [
        '当前未关闭的 issue 有多少个？其中没有任何标签的、没有负责人的各有多少个？返回一行，列名必须是 open_issues、without_labels、without_assignees。',
        backlog,
      ],
      [
        `${month.label}合并了多少个 PR？从创建到合并的时长中位数是多少小时？返回一行，列名必须是 merged_prs、median_hours。`,
        merges,
      ],
    ];
    for (const [index, [question, expected]] of questions.entries()) {
      const result = await ava.analyze(question, { strategy: { type: 'direct', maxRetries: 1 } });
      assert.equal(result.data.length, 1);
      for (const [name, value] of Object.entries(expected)) {
        assert.ok(
          Math.abs(Number(result.data[0][name]) - value) < 0.01,
          `${name}: ${result.data[0][name]} != ${value}`
        );
      }
      console.log(`PASS: natural-language business example ${index + 1}`);
      console.log('SQL:', result.sql);
      console.table(result.data);
      console.log(result.text);
    }
  }
} catch (error) {
  // Print only messages written by this example or AVA's GitHub loader, never provider errors.
  const known = error instanceof assert.AssertionError || error?.name === 'GitHubError';
  console.error(known ? error.message : 'Verification failed. Check the token, model settings and network.');
  process.exitCode = 1;
} finally {
  await ava.dispose();
}
