import { feishuGet } from './api';

import type { FeishuApi } from './api';

export interface WikiNode {
  objToken: string;
  objType: string;
  title: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Resolve a `/wiki/<nodeToken>` link to the object the node hosts.
 *
 * The app needs wiki read access and wiki space membership, which is separate
 * from the document grant on the hosted table.
 */
export async function resolveWikiNode(wikiToken: string, api: FeishuApi): Promise<WikiNode> {
  const url = `${api.origin}/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(wikiToken)}&obj_type=wiki`;
  const data = await feishuGet(url, api.token);
  const node = isRecord(data.node) ? data.node : {};
  const objToken = typeof node.obj_token === 'string' ? node.obj_token : '';
  if (!objToken) {
    throw new Error(`Feishu wiki node ${wikiToken} does not point at a document.`);
  }
  return {
    objToken,
    objType: typeof node.obj_type === 'string' ? node.obj_type : 'unknown',
    title: typeof node.title === 'string' ? node.title : '',
  };
}
