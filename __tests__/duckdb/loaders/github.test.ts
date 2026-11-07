import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { run as runSource } from '../../../src/cli/commands/source';
import { createSession } from '../../../src/cli/session/client';
import { sourceConfig } from '../../../src/cli/session/protocol';
import { loadGitHub } from '../../../src/duckdb/loaders/github';
import { GitHubClient, GitHubError, nextLink } from '../../../src/duckdb/loaders/github/client';
import { githubSince, isGitHubRepositoryUrl, parseRepository } from '../../../src/duckdb/loaders/github/config';

// Mock only HTTP and CLI session creation, never the client, converter or loader under test.
vi.mock('../../../src/cli/session/client', () => ({ createSession: vi.fn(async () => ({ datasetId: 'ds_x' })) }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const START = Date.parse('2026-11-01T00:00:00Z');
const user = (login: string, type = 'User') => ({ login, type });
const alice = user('alice');
const bob = user('bob');
const carol = user('carol');
const bot = user('dependabot[bot]', 'Bot');

function item(number: number, fields: Record<string, unknown>) {
  return {
    number,
    title: `Item ${number}`,
    state: 'open',
    user: bob,
    author_association: 'CONTRIBUTOR',
    assignees: [],
    labels: [],
    comments: 0,
    closed_at: null,
    html_url: `https://github.com/acme/widgets/issues/${number}`,
    ...fields,
  };
}
const pull = (mergedAt: string | null, draft = false) => ({ draft, pull_request: { merged_at: mergedAt } });
const times = (created: string, updated = created, closed: string | null = null) => ({
  created_at: created,
  updated_at: updated,
  closed_at: closed,
});

/** Issues and pull requests of the fictional acme/widgets, as the issues endpoint lists them. */
const items = [
  item(1, {
    state: 'closed',
    state_reason: 'completed',
    labels: [{ name: 'bug' }],
    assignees: [alice],
    comments: 2,
    ...times('2026-09-01T08:00:00Z', '2026-09-03T08:00:00Z', '2026-09-03T08:00:00Z'),
  }),
  item(2, {
    state: 'closed',
    user: alice,
    author_association: 'MEMBER',
    ...times('2026-09-01T10:00:00Z', '2026-09-02T12:00:00Z', '2026-09-02T12:00:00Z'),
    ...pull('2026-09-02T12:00:00Z'),
  }),
  item(3, { labels: [{ name: 'enhancement' }], comments: 1, ...times('2026-05-10T00:00:00Z', '2026-05-12T00:00:00Z') }),
  item(4, {
    state: 'closed',
    user: bot,
    ...times('2026-09-11T00:00:00Z', '2026-09-11T01:00:00Z', '2026-09-11T01:00:00Z'),
    ...pull('2026-09-11T01:00:00Z'),
  }),
  item(5, {
    user: carol,
    author_association: 'FIRST_TIME_CONTRIBUTOR',
    ...times('2026-10-05T00:00:00Z'),
    ...pull(null, true),
  }),
  item(6, { ...times('2026-10-07T00:00:00Z') }),
  item(7, {
    state: 'closed',
    ...times('2026-09-20T00:00:00Z', '2026-09-25T00:00:00Z', '2026-09-25T00:00:00Z'),
    ...pull(null),
  }),
  item(8, {
    state: 'closed',
    user: carol,
    labels: [{ name: 'enhancement' }],
    ...times('2026-10-01T00:00:00Z', '2026-10-03T00:00:00Z', '2026-10-03T00:00:00Z'),
    ...pull('2026-10-03T00:00:00Z'),
  }),
];

/** Serve the issues endpoint of acme/widgets: `state` and `since` filters, three items per page. */
function serveRepository(list = items) {
  const urls: URL[] = [];
  const fetch = vi.fn(async (input: string | URL) => {
    const url = new URL(String(input));
    urls.push(url);
    if (url.pathname.toLowerCase() !== '/repos/acme/widgets/issues') {
      return Response.json(
        { message: 'Not Found', documentation_url: 'https://docs.github.com/rest' },
        { status: 404 }
      );
    }
    const state = url.searchParams.get('state');
    const since = url.searchParams.get('since');
    const matching = list.filter(
      (entry) =>
        (state === 'all' || entry.state === state) && (!since || Date.parse(entry.updated_at) >= Date.parse(since))
    );
    const page = Number(url.searchParams.get('page') ?? '1');
    const headers = new Headers();
    if (page * 3 < matching.length) {
      const next = new URL(url);
      next.searchParams.set('page', String(page + 1));
      headers.set('link', `<${next.href}>; rel="next"`);
    }
    return Response.json(matching.slice((page - 1) * 3, page * 3), { headers });
  });
  vi.stubGlobal('fetch', fetch);
  return urls;
}

async function load(options: Record<string, unknown> = {}) {
  const ava = new AVA({ llm: { model: 'no-model-call' } });
  await ava.source({ type: 'github', options: { repository: 'acme/widgets', ...options } });
  return ava;
}

async function rows(ava: AVA, sql: string) {
  return (await ava.query(sql, { maxRows: 1000 })).data;
}

describe('configuration', () => {
  it.each([
    ['acme/widgets', 'widgets'],
    [' acme/widgets ', 'widgets'],
    ['https://github.com/acme/widgets', 'widgets'],
    ['https://www.github.com/acme/widgets.git/', 'widgets'],
    ['https://github.com/acme/widgets/issues?q=is%3Aopen', 'widgets'],
    ['https://github.com/acme/widgets/pulls', 'widgets'],
    ['https://github.com/acme/next.js', 'next.js'],
  ])('parses %s', (input, name) => {
    expect(parseRepository(input)).toEqual({ owner: 'acme', name });
    expect(isGitHubRepositoryUrl(input)).toBe(input.trim().startsWith('https://'));
  });

  it.each([
    'acme',
    'acme/widgets/extra',
    '-acme/widgets',
    'acme/..',
    'https://github.com/acme',
    'https://github.com/acme/widgets/issues/7',
    'https://github.com/acme/widgets/blob/main/data.csv',
    'https://gitlab.com/acme/widgets',
  ])('rejects %s', (input) => {
    expect(() => parseRepository(input)).toThrow('Invalid GitHub repository');
    expect(isGitHubRepositoryUrl(input)).toBe(false);
  });

  it.each([
    ['2026-01-01', '2026-01-01T00:00:00Z'],
    ['2026-01-01T08:30', '2026-01-01T08:30:00Z'],
    ['2026-01-01T08:00:00+08:00', '2026-01-01T00:00:00Z'],
  ])('normalizes since %s to UTC', (input, expected) => {
    expect(githubSince(input)).toBe(expected);
  });

  it.each([
    [{ since: 'last week' }, 'Invalid GitHub "since" value'],
    [{ since: '2026-02-30' }, 'Invalid GitHub "since" value'],
    [{ maxRecords: 100001 }, 'maxRecords'],
    [{ timeoutMs: 110001 }, 'timeoutMs'],
    [{ token: '' }, 'token'],
    [{ owner: 'acme' }, 'owner'],
  ])('rejects %j before any request', async (options, message) => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(loadGitHub({ repository: 'acme/widgets', ...options } as never)).rejects.toThrow(message);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('transport', () => {
  const page = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
    Response.json(body, { status, headers });

  /** A client whose sleeps advance a fake clock instead of waiting. */
  function client(replies: (Response | Error)[], token?: string, timeoutMs = 60000) {
    const waits: number[] = [];
    let now = START;
    const fetch = vi.fn(async () => {
      const reply = replies.shift();
      if (!reply || reply instanceof Error) throw reply ?? new Error('unexpected request');
      return reply;
    });
    vi.stubGlobal('fetch', fetch);
    const github = new GitHubClient(token, timeoutMs, {
      now: () => now,
      sleep: async (ms) => {
        waits.push(ms);
        now += ms;
      },
    });
    const list = (limit = 10) => github.list('/repos/acme/widgets/issues', { state: 'all' }, limit, 'Too many');
    return { fetch, waits, list };
  }

  it('sends the API headers, adds the token only when set, and follows next links', async () => {
    const next = '<https://api.github.com/repositories/1/issues?state=all&per_page=100&page=2>; rel="next"';
    const { fetch, list } = client([page([1, 2], 200, { link: next }), page([3])], 'secret');
    expect(await list()).toEqual([1, 2, 3]);
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      'https://api.github.com/repos/acme/widgets/issues?per_page=100&state=all',
      'https://api.github.com/repositories/1/issues?state=all&per_page=100&page=2',
    ]);
    expect(fetch.mock.calls[0][1]).toMatchObject({
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': '@antv/ava',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: 'Bearer secret',
      },
    });
    const anonymous = client([page([])]);
    await anonymous.list();
    expect(anonymous.fetch.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
    expect(nextLink('<https://a/1>; rel="prev", <https://a/3>; rel="next"')).toBe('https://a/3');
  });

  it('never follows a link off the API host and stops on a repeated page', async () => {
    await expect(
      client([page([1], 200, { link: '<https://evil.example/x>; rel="next"' })], 'secret').list()
    ).rejects.toThrow('GitHub pagination left https://api.github.com');
    const self = '<https://api.github.com/repos/acme/widgets/issues?per_page=100&state=all>; rel="next"';
    await expect(client([page([1], 200, { link: self })]).list()).rejects.toThrow('GitHub pagination repeated');
  });

  it('fails instead of truncating a list longer than the limit', async () => {
    const next = { link: '<https://api.github.com/x?page=2>; rel="next"' };
    await expect(client([page([1, 2], 200, next)]).list(2)).rejects.toThrow(
      'Too many. Set a later "since", or raise "maxRecords".'
    );
    expect(await client([page([1, 2])]).list(2)).toEqual([1, 2]);
  });

  it('waits for the primary rate limit to reset, also before the next request', async () => {
    const quota = (seconds: number) => ({
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': String(START / 1000 + seconds),
    });
    const limited = page({ message: 'API rate limit exceeded' }, 403, quota(30));
    const last = page([1], 200, { ...quota(40), link: '<https://api.github.com/x?page=2>; rel="next"' });
    const { waits, list } = client([limited, last, page([2])]);
    expect(await list()).toEqual([1, 2]);
    expect(waits).toEqual([31000, 10000]);
  });

  it('fails at once when the rate limit resets after the deadline', async () => {
    const limited = page({ message: 'API rate limit exceeded' }, 403, {
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': String(START / 1000 + 1800),
    });
    const { waits, list } = client([limited]);
    const error = await list().catch((caught) => caught);
    expect(error).toBeInstanceOf(GitHubError);
    expect(error.message).toBe(
      'GitHub rate limit reached before GET /repos/acme/widgets/issues?per_page=100&state=all (403 API rate limit exceeded). ' +
        'It resets at 2026-11-01T00:30:00.000Z. Unauthenticated requests share 60 per hour per IP address; ' +
        'set a token for 5,000 per hour.'
    );
    expect(waits).toEqual([]);
  });

  it('honors retry-after, waits a minute for other secondary limits, and gives up after three', async () => {
    const secondary = (headers: Record<string, string> = {}) =>
      page({ message: 'You have exceeded a secondary rate limit.' }, 403, headers);
    let { waits, list } = client([secondary(), secondary({ 'retry-after': '5' }), page([1])], 'secret', 110000);
    expect(await list()).toEqual([1]);
    expect(waits).toEqual([60000, 5000]);
    ({ waits, list } = client(
      [429, 429, 429, 429].map(() => page({ message: 'slow down' }, 429, { 'retry-after': '1' }))
    ));
    await expect(list()).rejects.toThrow('GitHub rate limit reached');
    expect(waits).toEqual([1000, 1000, 1000]);
  });

  it('retries server errors, network failures and cut-off bodies with backoff', async () => {
    const cutOff = new Response(
      new ReadableStream({
        start(controller) {
          controller.error(new TypeError('terminated'));
        },
      })
    );
    const { waits, list } = client([
      page({ message: 'Bad gateway' }, 502),
      new TypeError('fetch failed'),
      cutOff,
      page([1]),
    ]);
    expect(await list()).toEqual([1]);
    expect(waits).toEqual([1000, 2000, 4000]);
    const failing = client([1, 2, 3, 4].map(() => new TypeError('fetch failed')));
    await expect(failing.list()).rejects.toThrow('GitHub request failed: GET /repos/acme/widgets/issues');
  });

  it.each([
    [401, {}, 'Check that the token is valid and has not expired.'],
    [
      403,
      { 'x-github-sso': 'required; url=https://github.com/orgs/acme/sso?r=1' },
      'https://github.com/orgs/acme/sso?r=1',
    ],
    [403, {}, 'Check that the token can read this repository.'],
    [404, {}, 'Check the repository name; private repositories need a token with read access.'],
    [422, {}, 'See https://docs.github.com/rest'],
  ])('explains HTTP %i without retrying or exposing the token', async (status, headers, hint) => {
    const { fetch, list } = client(
      [page({ message: 'Denied', documentation_url: 'https://docs.github.com/rest' }, status, headers)],
      'secret'
    );
    const error = await list().catch((caught) => caught);
    expect(error).toMatchObject({ name: 'GitHubError', status });
    expect(error.message).toContain(
      `GitHub rejected GET /repos/acme/widgets/issues?per_page=100&state=all (${status} Denied)`
    );
    expect(error.message).toContain(hint);
    expect(error.message).not.toContain('secret');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid JSON and stops at the whole-load deadline', async () => {
    await expect(client([new Response('<html>')]).list()).rejects.toThrow('GitHub returned invalid JSON');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)))
      )
    );
    await expect(new GitHubClient(undefined, 20).list('/repos/acme/widgets/issues', {}, 10, 'x')).rejects.toThrow(
      'GitHub loading exceeded timeoutMs (20 ms) at GET /repos/acme/widgets/issues'
    );
  });
});

describe('GitHub HTTP → loader → DuckDB', () => {
  it('loads issues and pull requests as typed tables with keys and categorical values', async () => {
    serveRepository();
    const ava = await load({ token: 'secret' });
    try {
      const schema = await ava.schema();
      expect(schema.models.map((model) => [model.name, model.primaryKey])).toEqual([
        ['issues', 'number'],
        ['pull_requests', 'number'],
      ]);
      const issues = schema.models[0].columns;
      expect(issues).toContainEqual({ name: 'state', type: "ENUM('closed', 'open')", notNull: true });
      expect(issues).toContainEqual({
        name: 'state_reason',
        type: "ENUM('completed', 'duplicate', 'not_planned', 'reopened')",
        notNull: false,
      });
      expect(issues).toContainEqual({ name: 'labels', type: 'VARCHAR[]', notNull: false });
      expect(issues).toContainEqual({ name: 'created_at', type: 'TIMESTAMP', notNull: true });
      expect(schema.models[1].columns.map((column) => column.name)).toContain('is_merged');

      expect(
        await rows(
          ava,
          `SELECT number, state, state_reason, author, assignees, labels, comments,
          strftime(created_at, '%Y-%m-%d %H:%M:%S') AS created FROM issues ORDER BY number`
        )
      ).toEqual([
        {
          number: 1,
          state: 'closed',
          state_reason: 'completed',
          author: 'bob',
          assignees: ['alice'],
          labels: ['bug'],
          comments: 2,
          created: '2026-09-01 08:00:00',
        },
        {
          number: 3,
          state: 'open',
          state_reason: null,
          author: 'bob',
          assignees: [],
          labels: ['enhancement'],
          comments: 1,
          created: '2026-05-10 00:00:00',
        },
        {
          number: 6,
          state: 'open',
          state_reason: null,
          author: 'bob',
          assignees: [],
          labels: [],
          comments: 0,
          created: '2026-10-07 00:00:00',
        },
      ]);
      expect(
        await rows(
          ava,
          'SELECT number, state, is_merged, is_draft, author_is_bot, author_association FROM pull_requests ORDER BY number'
        )
      ).toEqual([
        {
          number: 2,
          state: 'closed',
          is_merged: true,
          is_draft: false,
          author_is_bot: false,
          author_association: 'MEMBER',
        },
        {
          number: 4,
          state: 'closed',
          is_merged: true,
          is_draft: false,
          author_is_bot: true,
          author_association: 'CONTRIBUTOR',
        },
        {
          number: 5,
          state: 'open',
          is_merged: false,
          is_draft: true,
          author_is_bot: false,
          author_association: 'FIRST_TIME_CONTRIBUTOR',
        },
        {
          number: 7,
          state: 'closed',
          is_merged: false,
          is_draft: false,
          author_is_bot: false,
          author_association: 'CONTRIBUTOR',
        },
        {
          number: 8,
          state: 'closed',
          is_merged: true,
          is_draft: false,
          author_is_bot: false,
          author_association: 'CONTRIBUTOR',
        },
      ]);
    } finally {
      await ava.dispose();
    }
  });

  it('answers the issue backlog and pull request merge time questions', async () => {
    serveRepository();
    const ava = await load();
    try {
      expect(
        await rows(
          ava,
          `SELECT count(*) AS open_issues,
            count(*) FILTER (WHERE len(labels) = 0) AS without_labels,
            count(*) FILTER (WHERE len(assignees) = 0) AS without_assignees,
            count(*) FILTER (WHERE created_at < TIMESTAMP '2026-08-01') AS opened_before_august
          FROM issues WHERE state = 'open'`
        )
      ).toEqual([{ open_issues: 2, without_labels: 1, without_assignees: 2, opened_before_august: 1 }]);
      expect(
        await rows(
          ava,
          `SELECT count(*) AS merged, median(date_diff('hour', created_at, merged_at)) AS median_hours
          FROM pull_requests WHERE is_merged AND NOT author_is_bot`
        )
      ).toEqual([{ merged: 2, median_hours: 37 }]);
    } finally {
      await ava.dispose();
    }
  });

  it('keeps the whole backlog with since, and the later state of an item read twice', async () => {
    const closing = {
      ...items[5],
      state: 'closed',
      state_reason: 'completed',
      ...times('2026-10-07T00:00:00Z', '2026-10-20T00:00:00Z', '2026-10-20T00:00:00Z'),
    };
    const urls = serveRepository([...items, closing]);
    const ava = await load({ since: '2026-09-15' });
    try {
      expect(urls.map((url) => [url.searchParams.get('state'), url.searchParams.get('since')])).toEqual([
        ['open', null],
        ['closed', '2026-09-15T00:00:00Z'],
      ]);
      expect(await rows(ava, 'SELECT number, state FROM issues ORDER BY number')).toEqual([
        { number: 3, state: 'open' },
        { number: 6, state: 'closed' },
      ]);
      expect(await rows(ava, 'SELECT list(number ORDER BY number) AS numbers FROM pull_requests')).toEqual([
        { numbers: [5, 7, 8] },
      ]);
    } finally {
      await ava.dispose();
    }
  });

  it('creates empty typed tables for a repository without issues or pull requests', async () => {
    serveRepository([]);
    const ava = await load();
    try {
      expect(
        await rows(ava, 'SELECT (SELECT count(*) FROM issues) AS issues, (SELECT count(*) FROM pull_requests) AS pulls')
      ).toEqual([{ issues: 0, pulls: 0 }]);
      expect((await ava.schema()).models[1].columns).toContainEqual({
        name: 'merged_at',
        type: 'TIMESTAMP',
        notNull: false,
      });
    } finally {
      await ava.dispose();
    }
  });

  it.each([
    [[{ ...items[0], number: 'one' }], 'GitHub returned an invalid issue or pull request; nothing was loaded.'],
    [
      [{ ...items[0], created_at: 'yesterday' }],
      'GitHub returned an invalid issue or pull request; nothing was loaded.',
    ],
    [[...items, ...items, ...items], 'acme/widgets has more than 20 issues and pull requests.'],
  ])('fails without a partial source: %#', async (list, message) => {
    serveRepository(list as typeof items);
    await expect(load({ maxRecords: 20 })).rejects.toThrow(message);
  });

  it('reports a repository that does not exist or is not accessible', async () => {
    serveRepository();
    await expect(load({ repository: 'acme/missing' })).rejects.toThrow(
      'GitHub rejected GET /repos/acme/missing/issues?per_page=100&state=all (404 Not Found). Check the repository name'
    );
  });
});

describe('GitHub CLI source', () => {
  const sessionConfig = () => vi.mocked(createSession).mock.calls.at(-1)?.[0];

  it.each([
    'https://github.com/antvis/AVA',
    'https://github.com/antvis/AVA/issues',
    'https://github.com/antvis/AVA/pulls',
    'https://github.com/antvis/AVA.git',
  ])('detects %s and reads GH_TOKEN before GITHUB_TOKEN', async (link) => {
    vi.stubEnv('GH_TOKEN', 'gh-token');
    vi.stubEnv('GITHUB_TOKEN', 'github-token');
    await runSource([link], {});
    expect(sessionConfig()).toEqual({ type: 'github', options: { repository: link, token: 'gh-token' } });
  });

  it('accepts owner/name with --type github, keeps a configured token, and works without one', async () => {
    vi.stubEnv('GH_TOKEN', '');
    vi.stubEnv('GITHUB_TOKEN', 'github-token');
    await runSource(['antvis/AVA'], { type: 'github' });
    expect(sessionConfig()).toEqual({ type: 'github', options: { repository: 'antvis/AVA', token: 'github-token' } });
    vi.stubEnv('GITHUB_TOKEN', '');
    await runSource(['antvis/AVA'], { type: 'github' });
    expect(sessionConfig()).toEqual({ type: 'github', options: { repository: 'antvis/AVA' } });
    const config = {
      type: 'github',
      options: { repository: 'antvis/AVA', token: 'config-token', since: '2026-01-01' },
    };
    expect(sourceConfig.parse(config)).toEqual(config);
  });

  it('rejects other GitHub links, --type with a link, and engines other than DuckDB', async () => {
    for (const link of ['https://github.com/antvis/AVA/issues/1015', 'https://github.com/antvis']) {
      await expect(runSource([link], {})).rejects.toThrow('Only GitHub repository links are supported');
    }
    await expect(runSource(['https://github.com/antvis/AVA'], { type: 'github' })).rejects.toThrow(
      '--type cannot be combined with a GitHub repository link.'
    );
    await expect(runSource(['https://github.com/antvis/AVA'], { engine: 'python' })).rejects.toThrow(
      'GitHub sources require the duckdb engine.'
    );
    expect(createSession).not.toHaveBeenCalled();
  });
});
