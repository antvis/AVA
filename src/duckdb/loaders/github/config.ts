import { z } from 'zod';

export interface GitHubRepository {
  owner: string;
  name: string;
}

/** GitHub logins: up to 39 letters, digits and hyphens, not starting with a hyphen. */
const OWNER = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/;
/** Repository names: up to 100 ASCII letters, digits, `.`, `-` and `_`. */
const NAME = /^[A-Za-z0-9._-]{1,100}$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/i;

function invalidRepository(input: string): Error {
  return new Error(`Invalid GitHub repository "${input}". Use owner/name or https://github.com/owner/name.`);
}

/** Parse `owner/name`, or a github.com link to a repository or its issue or pull request list. */
export function parseRepository(input: string): GitHubRepository {
  const value = input.trim();
  let parts: string[];
  if (/^https?:\/\//i.test(value)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw invalidRepository(input);
    }
    if (!['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) throw invalidRepository(input);
    parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 3 && ['issues', 'pulls'].includes(parts[2].toLowerCase())) parts.pop();
  } else {
    parts = value.split('/');
  }
  const [owner, repository] = parts;
  const name = repository?.replace(/\.git$/i, '');
  if (parts.length !== 2 || !OWNER.test(owner) || !name || !NAME.test(name) || /^\.+$/.test(name)) {
    throw invalidRepository(input);
  }
  return { owner, name };
}

/** Whether a CLI argument is a github.com link that names a repository. */
export function isGitHubRepositoryUrl(input: string): boolean {
  try {
    return /^https?:\/\//i.test(input) && Boolean(parseRepository(input));
  } catch {
    return false;
  }
}

/** Normalize `since` to GitHub's `YYYY-MM-DDTHH:MM:SSZ`; dates and timestamps without an offset are UTC. */
export function githubSince(value: string): string {
  const input = value.trim();
  const match = DATE.exec(input);
  const invalid = new Error(`Invalid GitHub "since" value "${value}". Use an ISO 8601 date such as 2026-01-01.`);
  if (!match) throw invalid;
  const [year, month, day] = match.slice(1, 4).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw invalid;
  const time = Date.parse(/T/i.test(input) && !match[4] ? `${input}Z` : input);
  if (Number.isNaN(time)) throw invalid;
  return new Date(time).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export const githubOptionsSchema = z
  .object({
    repository: z.string().trim().min(1),
    token: z.string().trim().min(1).optional(),
    since: z.string().trim().min(1).optional(),
    maxRecords: z.number().int().min(1).max(100000).optional(),
    timeoutMs: z.number().int().min(1).max(110000).optional(),
  })
  .strict();
