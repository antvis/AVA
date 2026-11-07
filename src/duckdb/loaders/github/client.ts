import { setTimeout as delay } from 'node:timers/promises';

const API = 'https://api.github.com';
/** Network errors, cut-off bodies and 5xx responses are retried after 1, 2 and 4 seconds. */
const RETRIES = 3;
const RATE_LIMIT_RETRIES = 3;
/** GitHub asks clients to wait at least a minute after a secondary rate limit without retry-after. */
const SECONDARY_LIMIT_WAIT_MS = 60_000;

export class GitHubError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'GitHubError';
  }
}

/** Timer hooks, replaced in tests. */
export interface GitHubClock {
  now: () => number;
  sleep: (ms: number, signal: AbortSignal) => Promise<unknown>;
}

const realClock: GitHubClock = {
  now: () => Date.now(),
  sleep: (ms, signal) => delay(ms, undefined, { signal }),
};

/** Path and query of a request; never contains credentials. */
const describe = (url: URL) => `${url.pathname}${url.search}`;

/** The rel="next" target of a Link header. */
export function nextLink(header: string | null): string | undefined {
  for (const part of header?.split(',') ?? []) {
    const match = /<([^>]+)>\s*;\s*rel="([^"]+)"/.exec(part);
    if (match?.[2].split(/\s+/).includes('next')) return match[1];
  }
  return undefined;
}

function detail(response: Response, text: string): { message: string; docs?: string } {
  try {
    const body = JSON.parse(text);
    return {
      message: typeof body?.message === 'string' && body.message ? body.message : response.statusText,
      docs: typeof body?.documentation_url === 'string' ? body.documentation_url : undefined,
    };
  } catch {
    return { message: response.statusText };
  }
}

/**
 * Read-only GitHub REST client with Link pagination, the retry rules GitHub
 * documents for rate limits, and one deadline for the whole load.
 * https://docs.github.com/rest/using-the-rest-api/rate-limits-for-the-rest-api
 */
export class GitHubClient {
  private readonly signal: AbortSignal;
  private readonly deadline: number;
  /** Set when GitHub reports no remaining requests, so the next request waits for the reset. */
  private resetAt: number | undefined;

  constructor(
    private readonly token: string | undefined,
    private readonly timeoutMs: number,
    private readonly clock: GitHubClock = realClock
  ) {
    this.signal = AbortSignal.timeout(timeoutMs);
    this.deadline = clock.now() + timeoutMs;
  }

  /** Every item of a list endpoint; fails with `tooMany` instead of returning more than `limit` items. */
  async list(path: string, query: Record<string, string>, limit: number, tooMany: string): Promise<unknown[]> {
    const items: unknown[] = [];
    const seen = new Set<string>();
    let url: URL | undefined = new URL(`${API}${path}?${new URLSearchParams({ per_page: '100', ...query })}`);
    while (url) {
      if (seen.has(url.href)) throw new GitHubError(`GitHub pagination repeated ${describe(url)}`);
      seen.add(url.href);
      const { body, link } = await this.get(url);
      if (!Array.isArray(body)) throw new GitHubError(`GitHub returned a non-list response for ${describe(url)}`);
      items.push(...body);
      const next = nextLink(link);
      if (items.length > limit || (next && items.length >= limit)) {
        throw new GitHubError(`${tooMany}. Set a later "since", or raise "maxRecords".`);
      }
      // Pagination links stay on the API host, so the token is never sent elsewhere.
      url = next ? new URL(next) : undefined;
      if (url && url.origin !== API) throw new GitHubError(`GitHub pagination left ${API}: ${url.origin}`);
    }
    return items;
  }

  private async get(url: URL): Promise<{ body: unknown; link: string | null }> {
    let transient = 0;
    let limited = 0;
    for (;;) {
      if (this.resetAt !== undefined) await this.wait(this.resetAt - this.clock.now(), url, this.rateLimitError(url));

      let response: Response;
      let text: string;
      try {
        response = await fetch(url, {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': '@antv/ava',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },
          signal: this.signal,
        });
        // Read the body inside the retry: a connection can also drop in the middle of it.
        text = await response.text();
      } catch (error) {
        if (this.signal.aborted) throw this.timeoutError(url);
        if (transient >= RETRIES) {
          throw new GitHubError(`GitHub request failed: GET ${describe(url)} (${(error as Error)?.message ?? error})`);
        }
        await this.wait(1000 * 2 ** transient++, url);
        continue;
      }

      const remaining = response.headers.get('x-ratelimit-remaining');
      const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000;
      this.resetAt = remaining === '0' && reset > 0 ? reset + 1000 : undefined;
      if (response.ok) {
        try {
          return { body: JSON.parse(text), link: response.headers.get('link') };
        } catch {
          throw new GitHubError(`GitHub returned invalid JSON for ${describe(url)}`, response.status);
        }
      }

      const { message, docs } = detail(response, text);
      const retryAfter = response.headers.get('retry-after');
      const rateLimited =
        response.status === 429 ||
        (response.status === 403 && (remaining === '0' || retryAfter !== null || /rate limit/i.test(message)));
      if (rateLimited && limited < RATE_LIMIT_RETRIES) {
        const wait =
          retryAfter !== null && /^\d+$/.test(retryAfter)
            ? Number(retryAfter) * 1000
            : this.resetAt !== undefined
            ? this.resetAt - this.clock.now()
            : SECONDARY_LIMIT_WAIT_MS * 2 ** limited;
        limited += 1;
        await this.wait(wait, url, this.rateLimitError(url, response.status, message));
        this.resetAt = undefined;
        continue;
      }
      if (rateLimited) throw this.rateLimitError(url, response.status, message);
      if (response.status >= 500 && transient < RETRIES) {
        await this.wait(1000 * 2 ** transient++, url);
        continue;
      }
      throw this.httpError(response, url, message, docs);
    }
  }

  /** Wait unless the wait would pass the deadline; then fail at once with `error`. */
  private async wait(ms: number, url: URL, error = this.timeoutError(url)): Promise<void> {
    if (ms <= 0) return;
    if (this.clock.now() + ms > this.deadline) throw error;
    try {
      await this.clock.sleep(ms, this.signal);
    } catch {
      throw this.timeoutError(url);
    }
  }

  private timeoutError(url: URL): GitHubError {
    return new GitHubError(
      `GitHub loading exceeded timeoutMs (${this.timeoutMs} ms) at GET ${describe(url)}. ` +
        'Set a later "since", or raise "timeoutMs".'
    );
  }

  private rateLimitError(url: URL, status?: number, message?: string): GitHubError {
    const reset = this.resetAt === undefined ? '' : ` It resets at ${new Date(this.resetAt - 1000).toISOString()}.`;
    const advice = this.token
      ? ' Wait for the reset, or load a shorter period with "since".'
      : ' Unauthenticated requests share 60 per hour per IP address; set a token for 5,000 per hour.';
    return new GitHubError(
      `GitHub rate limit reached before GET ${describe(url)}${
        message ? ` (${status} ${message})` : ''
      }.${reset}${advice}`,
      status
    );
  }

  private httpError(response: Response, url: URL, message: string, docs?: string): GitHubError {
    const { status } = response;
    const context = `GET ${describe(url)} (${status} ${message})`;
    const sso = /url=(\S+)/.exec(response.headers.get('x-github-sso') ?? '')?.[1];
    const hints: Record<number, string> = {
      401: 'Check that the token is valid and has not expired.',
      403: sso
        ? `Authorize the token for the organization's SAML single sign-on: ${sso}`
        : 'Check that the token can read this repository.',
      404: 'Check the repository name; private repositories need a token with read access.',
    };
    return new GitHubError(
      `GitHub rejected ${context}. ${hints[status] ?? (docs ? `See ${docs}` : '')}`.trim(),
      status
    );
  }
}
