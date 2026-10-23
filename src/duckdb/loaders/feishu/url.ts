export interface BitableRef {
  appToken: string;
  tableId: string;
}

/**
 * A Feishu link that points at a Bitable, either directly (`/base/<appToken>`) or
 * through a wiki node (`/wiki/<nodeToken>`). A wiki token is a node token, not the
 * app token, so it has to be resolved before the Bitable API can be used.
 */
export interface FeishuTableLink {
  kind: 'base' | 'wiki';
  token: string;
  tableId?: string;
}

export function parseTableLink(input: string): FeishuTableLink | undefined {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return undefined;
  }
  const segments = url.pathname.split('/').filter(Boolean);
  const candidates = (['base', 'wiki'] as const)
    .map((kind) => ({ kind, index: segments.findIndex((segment) => segment.toLowerCase() === kind) }))
    .filter((candidate) => candidate.index !== -1 && Boolean(segments[candidate.index + 1]))
    .sort((a, b) => a.index - b.index);
  if (candidates.length === 0) {
    return undefined;
  }
  const [{ kind, index }] = candidates;
  return {
    kind,
    token: segments[index + 1],
    tableId: url.searchParams.get('table') || undefined,
  };
}

/**
 * Parse a `/base/` link that names its table, e.g. `/base/<appToken>?table=<tableId>`.
 */
export function parseBitableUrl(input: string): BitableRef {
  const link = parseTableLink(input);
  if (!link || link.kind !== 'base' || !link.tableId) {
    throw new Error(`Invalid Feishu Bitable URL: ${input}`);
  }
  return { appToken: link.token, tableId: link.tableId };
}
