import { GitHubError } from './client';

export type GitHubCell = string | number | boolean | string[] | null;
export type GitHubRow = Record<string, GitHubCell>;

export interface GitHubColumn {
  name: string;
  /** DuckDB type. */
  type: string;
  notNull?: boolean;
  /** Documented values of a categorical column; it becomes an ENUM of these and any other value read. */
  values?: readonly string[];
}

export interface GitHubTable {
  name: 'issues' | 'pull_requests';
  columns: GitHubColumn[];
}

const column = (name: string, type: string, notNull = false): GitHubColumn => ({ name, type, notNull });
const category = (name: string, values: readonly string[], notNull = false): GitHubColumn => ({
  name,
  type: 'VARCHAR',
  notNull,
  values,
});

const identity = [
  column('number', 'INTEGER', true),
  column('title', 'VARCHAR'),
  category('state', ['closed', 'open'], true),
];
const people = [
  column('author', 'VARCHAR'),
  category('author_association', [
    'COLLABORATOR',
    'CONTRIBUTOR',
    'FIRST_TIMER',
    'FIRST_TIME_CONTRIBUTOR',
    'MANNEQUIN',
    'MEMBER',
    'NONE',
    'OWNER',
  ]),
  column('author_is_bot', 'BOOLEAN'),
  column('assignees', 'VARCHAR[]'),
  column('labels', 'VARCHAR[]'),
  column('comments', 'INTEGER'),
];
const times = [
  column('created_at', 'TIMESTAMP', true),
  column('updated_at', 'TIMESTAMP', true),
  column('closed_at', 'TIMESTAMP'),
];

export const issuesTable: GitHubTable = {
  name: 'issues',
  columns: [
    ...identity,
    category('state_reason', ['completed', 'duplicate', 'not_planned', 'reopened']),
    ...people,
    ...times,
    column('html_url', 'VARCHAR'),
  ],
};

/** As on GitHub, a merged pull request is closed; is_merged tells merged ones apart. */
export const pullRequestsTable: GitHubTable = {
  name: 'pull_requests',
  columns: [
    ...identity,
    column('is_draft', 'BOOLEAN'),
    column('is_merged', 'BOOLEAN'),
    ...people,
    ...times,
    column('merged_at', 'TIMESTAMP'),
    column('html_url', 'VARCHAR'),
  ],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function invalid(): never {
  throw new GitHubError('GitHub returned an invalid issue or pull request; nothing was loaded.');
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/** Names of labels or logins of users, in API order. */
function names(values: unknown, key: string): string[] {
  if (!Array.isArray(values)) return [];
  return values.flatMap((value) => {
    const name = isObject(value) ? text(value[key]) : text(value);
    return name === null ? [] : [name];
  });
}

/** An ISO 8601 time as a UTC `YYYY-MM-DD HH:MM:SS` TIMESTAMP, matching GitHub search qualifiers. */
export function utc(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const time = typeof value === 'string' ? Date.parse(value) : NaN;
  if (Number.isNaN(time)) invalid();
  return new Date(time).toISOString().slice(0, 19).replace('T', ' ');
}

/** Convert an item of the issues endpoint, which lists pull requests as issues with a pull_request field. */
export function convertItem(raw: unknown): { table: GitHubTable['name']; row: GitHubRow } {
  if (!isObject(raw) || !Number.isSafeInteger(raw.number) || (raw.state !== 'open' && raw.state !== 'closed')) {
    invalid();
  }
  const createdAt = utc(raw.created_at);
  const updatedAt = utc(raw.updated_at);
  if (createdAt === null || updatedAt === null) invalid();
  const user = isObject(raw.user) ? raw.user : {};
  const row: GitHubRow = {
    number: raw.number as number,
    title: text(raw.title),
    state: raw.state,
    author: text(user.login),
    author_association: text(raw.author_association),
    author_is_bot: typeof user.type === 'string' ? user.type === 'Bot' : null,
    assignees: names(raw.assignees, 'login'),
    labels: names(raw.labels, 'name'),
    comments: Number.isSafeInteger(raw.comments) ? (raw.comments as number) : null,
    created_at: createdAt,
    updated_at: updatedAt,
    closed_at: utc(raw.closed_at),
    html_url: text(raw.html_url),
  };
  if (!isObject(raw.pull_request)) return { table: 'issues', row: { ...row, state_reason: text(raw.state_reason) } };

  const mergedAt = utc(raw.pull_request.merged_at);
  return {
    table: 'pull_requests',
    row: {
      ...row,
      is_draft: typeof raw.draft === 'boolean' ? raw.draft : null,
      is_merged: mergedAt !== null,
      merged_at: mergedAt,
    },
  };
}
