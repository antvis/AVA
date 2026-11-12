import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { run as runSource } from '../../../src/cli/commands/source';
import { createSession } from '../../../src/cli/session/client';
import { GitHubClient } from '../../../src/duckdb/loaders/github/client';

import type { GitHubSourceOptions } from '../../../src';

vi.mock('../../../src/cli/session/client', () => ({ createSession: vi.fn(async () => ({ datasetId: 'ds_x' })) }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const repository = 'acme/widgets';
const issuesPath = `/repos/${repository}/issues`;
const start = Date.parse('2026-11-01T00:00:00Z');
const nextPage = (page: number) => `<https://api.github.com/repositories/1/issues?page=${page}>; rel="next"`;

function mockFetch(...responses: (Response | Error)[]) {
  const fetchMock = vi.fn<typeof fetch>(async () => {
    const response = responses.shift();
    if (response instanceof Response) return response;
    throw response ?? new Error('Unexpected fetch');
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function item(number: number, fields: Record<string, unknown> = {}) {
  return {
    number,
    state: 'open',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    assignees: [],
    labels: [],
    ...fields,
  };
}

describe('GitHub transport', () => {
  function client(responses: (Response | Error)[], token?: string, timeoutMs = 60000) {
    const fetch = mockFetch(...responses);
    const waits: number[] = [];
    let now = start;
    const github = new GitHubClient(token, timeoutMs, {
      now: () => now,
      sleep: async (ms) => {
        waits.push(ms);
        now += ms;
      },
    });
    const list = async (state = 'all') => {
      const items: unknown[] = [];
      await github.forEachItem(issuesPath, { state }, (entry) => items.push(entry));
      return items;
    };
    return { fetch, list, waits };
  }

  it('follows pagination with the token and decodes split UTF-8 characters', async () => {
    const bytes = new TextEncoder().encode('["你"]');
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.subarray(0, 3));
        controller.enqueue(bytes.subarray(3));
        controller.close();
      },
    });
    const first = new Response(body, { headers: { link: `<https://api.github.com/x>; rel="prev", ${nextPage(2)}` } });
    const { fetch, list } = client([first, Response.json([2])], 'secret');
    expect(await list()).toEqual(['你', 2]);
    expect(String(fetch.mock.calls[1][0])).toBe('https://api.github.com/repositories/1/issues?page=2');
    expect(fetch.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer secret',
      'X-GitHub-Api-Version': '2022-11-28',
    });
  });

  it.each([
    ['https://other.example/issues', 'GitHub pagination left'],
    [`https://api.github.com${issuesPath}?per_page=100&state=all`, 'GitHub pagination repeated'],
  ])('stops before following an unsafe or repeated link (%s)', async (url, message) => {
    const response = Response.json([], { headers: { link: `<${url}>; rel="next"` } });
    const { fetch, list } = client([response], 'secret');
    await expect(list()).rejects.toThrow(message);
    expect(fetch).toHaveBeenCalledOnce();
  });

  function paddedPage(mib: number, headers: Record<string, string> = {}, cancel?: () => void) {
    const padding = new Uint8Array(1024 * 1024).fill(32);
    let remaining = mib * padding.byteLength - 2;
    return new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(Uint8Array.of(91, 93)); // []
        },
        pull(controller) {
          if (remaining === 0) return controller.close();
          const size = Math.min(remaining, padding.byteLength);
          controller.enqueue(padding.subarray(0, size));
          remaining -= size;
        },
        cancel,
      }),
      { headers }
    );
  }

  it('cancels an oversized response without retrying', async () => {
    const cancel = vi.fn();
    const { fetch, list } = client([paddedPage(20, {}, cancel)]);
    await expect(list()).rejects.toThrow('16 MiB per-response limit');
    expect(cancel).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('enforces the total read limit across pages and both scans', async () => {
    const openPages = [2, 3, 4].map((page) => paddedPage(16, { link: nextPage(page) }));
    const cancel = vi.fn();
    const { fetch, list } = client([...openPages, paddedPage(16), paddedPage(2, {}, cancel)]);
    await list('open');
    await expect(list('closed')).rejects.toThrow('64 MiB total read limit');
    expect(cancel).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  function quota(seconds: number) {
    return { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(start / 1000 + seconds) };
  }

  it.each([
    [1, 31000],
    [45, 45000],
  ])('honors both rate-limit headers and waits before the next page (%i seconds)', async (retry, wait) => {
    const limited = Response.json(
      { message: 'API rate limit exceeded' },
      { status: 429, headers: { ...quota(30), 'retry-after': String(retry) } }
    );
    const first = Response.json([1], { headers: { ...quota(55), link: nextPage(2) } });
    const { list, waits } = client([limited, first, Response.json([2])]);
    expect(await list()).toEqual([1, 2]);
    expect(waits).toEqual([wait, 56000 - wait]);
  });

  it('fails immediately when a rate-limit reset exceeds the deadline', async () => {
    const limited = Response.json(
      { message: 'API rate limit exceeded' },
      { status: 403, headers: { ...quota(1800), 'retry-after': '1' } }
    );
    const { fetch, list, waits } = client([limited]);
    await expect(list()).rejects.toThrow('It resets at 2026-11-01T00:30:00.000Z');
    expect(waits).toEqual([]);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('waits a minute for a secondary limit without a retry hint', async () => {
    const limited = Response.json({ message: 'You have exceeded a secondary rate limit.' }, { status: 403 });
    const { list, waits } = client([limited, Response.json([])], undefined, 110000);
    await list();
    expect(waits).toEqual([60000]);
  });

  it('backs off after server errors, network errors and interrupted responses', async () => {
    const cutOff = new Response(
      new ReadableStream({
        start(controller) {
          controller.error(new TypeError('terminated'));
        },
      })
    );
    const { list, waits } = client([
      Response.json({ message: 'Bad gateway' }, { status: 502 }),
      new TypeError('fetch failed'),
      cutOff,
      Response.json([1]),
    ]);
    expect(await list()).toEqual([1]);
    expect(waits).toEqual([1000, 2000, 4000]);
  });

  it('uses the status code when a non-JSON response has no message', async () => {
    const { fetch, list } = client([new Response('<html>', { status: 403 })]);
    await expect(list()).rejects.toMatchObject({ message: 'HTTP 403', status: 403 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('aborts an in-flight request at the load deadline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)))
      )
    );
    await expect(new GitHubClient(undefined, 20).forEachItem(issuesPath, {}, () => {})).rejects.toThrow(
      'GitHub loading exceeded timeoutMs (20 ms)'
    );
  });
});

describe('GitHub SDK source', () => {
  let ava: AVA;

  beforeEach(() => {
    ava = new AVA({ llm: { model: 'no-model-call' } });
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await ava.dispose();
  });

  function load(options: Partial<GitHubSourceOptions> = {}) {
    return ava.source({ type: 'github', options: { repository, ...options } });
  }

  it('loads paginated issues and pull requests into typed tables', async () => {
    const issue = item(1, {
      state: 'closed',
      state_reason: 'completed',
      assignees: [{ login: 'alice' }],
      labels: [{ name: 'bug' }],
      comments: 2,
    });
    const merged = item(2, {
      state: 'closed',
      user: { login: 'dependabot[bot]', type: 'Bot' },
      author_association: 'MEMBER',
      pull_request: { merged_at: '2026-09-02T12:00:00Z' },
    });
    const draft = item(3, { draft: true, pull_request: { merged_at: null } });
    const closed = item(4, { state: 'closed', pull_request: { merged_at: null } });
    const fetch = mockFetch(
      Response.json([issue], { headers: { link: nextPage(2) } }),
      Response.json([merged, draft, closed])
    );
    await load();
    expect(fetch.mock.calls[0][1]?.headers).not.toHaveProperty('Authorization');

    const { models } = await ava.schema();
    expect(models.map(({ name, primaryKey }) => [name, primaryKey])).toEqual([
      ['issues', 'number'],
      ['pull_requests', 'number'],
    ]);
    expect(models[0].columns).toContainEqual({ name: 'state', type: "ENUM('closed', 'open')", notNull: true });
    expect(models[0].columns).toContainEqual({ name: 'labels', type: 'VARCHAR[]', notNull: false });
    const issues = await ava.query('SELECT number, state_reason, assignees, labels, comments FROM issues');
    expect(issues.data).toEqual([
      { number: 1, state_reason: 'completed', assignees: ['alice'], labels: ['bug'], comments: 2 },
    ]);
    const pulls = await ava.query(`SELECT number, state, is_draft, is_merged, author_is_bot, author_association,
      strftime(merged_at, '%Y-%m-%d %H:%M:%S') AS merged_at FROM pull_requests ORDER BY number`);
    expect(pulls.data).toMatchObject([
      {
        number: 2,
        is_merged: true,
        author_is_bot: true,
        author_association: 'MEMBER',
        merged_at: '2026-09-02 12:00:00',
      },
      { number: 3, is_draft: true, is_merged: false },
      { number: 4, state: 'closed', is_merged: false, merged_at: null },
    ]);
  });

  it('queries GitHub and CSV together using qualified table names', async () => {
    mockFetch(Response.json([item(1), item(2, { pull_request: { merged_at: null } })]));
    await ava.source([
      { name: 'repo', type: 'github', options: { repository } },
      { name: 'labels', type: 'csv', options: { csv: 'number,label\n1,priority\n' } },
    ]);

    const { models } = await ava.schema();
    expect(models.map(({ name, tableReference }) => [name, tableReference])).toEqual([
      ['repo.issues', { schema: 'repo', table: 'issues' }],
      ['repo.pull_requests', { schema: 'repo', table: 'pull_requests' }],
      ['labels.data', { schema: 'labels', table: 'data' }],
    ]);
    const result = await ava.query('SELECT number, label FROM repo.issues JOIN labels.data USING (number)');
    expect(result.data).toEqual([{ number: 1, label: 'priority' }]);
  });

  it('keeps old open items and counts a duplicate only once at maxRecords', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(start);
    const fetch = mockFetch(
      Response.json([item(1), item(2)]),
      Response.json([item(2, { state: 'closed', updated_at: '2026-09-20T00:00:00Z' })])
    );
    await load({ since: '2026-09-15T08:00:00+08:00', maxRecords: 2 });
    expect(fetch.mock.calls.map(([url]) => Object.fromEntries(new URL(String(url)).searchParams))).toEqual([
      { per_page: '100', state: 'open' },
      { per_page: '100', state: 'all', since: '2026-09-15T00:00:00Z' },
    ]);
    expect((await ava.query('SELECT number, state FROM issues ORDER BY number')).data).toEqual([
      { number: 1, state: 'open' },
      { number: 2, state: 'closed' },
    ]);
  });

  it('keeps an issue reopened between scans even when since is in the future', async () => {
    const reopenedAt = '2026-09-16T00:00:00Z';
    let reopened = item(1, { state: 'closed' });
    const stillClosed = item(2, { state: 'closed', updated_at: reopenedAt });
    vi.stubGlobal('fetch', async (input: URL) => {
      const params = new URL(input).searchParams;
      const state = params.get('state');
      const since = params.get('since');
      const result = [reopened, stillClosed].filter(
        (entry) => (state === 'all' || entry.state === state) && (!since || entry.updated_at > since)
      );
      reopened = { ...reopened, state: 'open', updated_at: reopenedAt };
      return Response.json(result);
    });
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse(reopenedAt));
    await load({ since: '2026-09-17', maxRecords: 1 });
    expect((await ava.query('SELECT number, state FROM issues')).data).toEqual([{ number: 1, state: 'open' }]);
  });

  it('creates queryable, typed tables for an empty repository', async () => {
    mockFetch(Response.json([]));
    await load();
    expect((await ava.schema()).models[1].columns).toContainEqual({
      name: 'merged_at',
      type: 'TIMESTAMP',
      notNull: false,
    });
    const result = await ava.query(
      'SELECT (SELECT count(*) FROM issues) AS issues, (SELECT count(*) FROM pull_requests) AS pulls'
    );
    expect(result.data).toEqual([{ issues: 0, pulls: 0 }]);
  });

  it('rejects invalid configuration before fetching', async () => {
    const fetch = mockFetch();
    await expect(load({ since: '2026-02-30' })).rejects.toThrow('Invalid GitHub "since" value');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails when there are more distinct records than maxRecords', async () => {
    mockFetch(Response.json([item(1), item(2)]));
    await expect(load({ maxRecords: 1 })).rejects.toThrow('has more than 1 issues and pull requests');
  });

  it('rejects a malformed record instead of loading a partial snapshot', async () => {
    mockFetch(Response.json([item(1), item(2, { created_at: 'yesterday' })]));
    await expect(load()).rejects.toThrow('GitHub returned an invalid issue or pull request; nothing was loaded.');
  });

  it('forwards an upstream error message and status without retrying', async () => {
    const fetch = mockFetch(Response.json({ message: 'Not Found' }, { status: 404 }));
    await expect(load()).rejects.toMatchObject({ name: 'Error', message: 'Not Found', status: 404 });
    expect(fetch).toHaveBeenCalledOnce();
  });
});

describe('GitHub CLI source', () => {
  const sessionSources = () => vi.mocked(createSession).mock.calls.at(-1)?.[0];

  it('loads a GitHub issues link and a file in one session using GH_TOKEN first', async () => {
    vi.stubEnv('GH_TOKEN', 'gh-token');
    vi.stubEnv('GITHUB_TOKEN', 'github-token');
    const url = 'https://github.com/antvis/AVA/issues?q=is%3Aopen';
    await runSource([url, 'labels.csv'], {});
    expect(createSession).toHaveBeenCalledOnce();
    expect(sessionSources()).toEqual([
      { type: 'github', options: { repository: url, token: 'gh-token' } },
      { type: 'csv-file', options: { path: resolve('labels.csv') } },
    ]);
  });

  it('prefers a token from @file over environment variables', async () => {
    vi.stubEnv('GH_TOKEN', 'gh-token');
    const config = { type: 'github', options: { repository: 'antvis/AVA', token: 'config-token' } };
    const directory = await mkdtemp(join(tmpdir(), 'ava-github-cli-'));
    try {
      const path = join(directory, 'source.json');
      await writeFile(path, JSON.stringify(config));
      await runSource([`@${path}`], {});
      expect(sessionSources()).toEqual([config]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('accepts owner/name with --type github and falls back to GITHUB_TOKEN', async () => {
    vi.stubEnv('GH_TOKEN', '');
    vi.stubEnv('GITHUB_TOKEN', 'github-token');
    await runSource(['antvis/AVA'], { type: 'github' });
    expect(sessionSources()).toEqual([{ type: 'github', options: { repository: 'antvis/AVA', token: 'github-token' } }]);
  });

  it('keeps GitHub raw CSV links as file sources', async () => {
    const path = 'https://github.com/antvis/AVA/raw/oss-camp2026/data/companies.csv';
    await runSource([path], {});
    expect(sessionSources()).toEqual([{ type: 'csv-file', options: { path } }]);
  });
});
