import { parseTableLink } from './url';
import { resolveWikiNode } from './wiki';

import type { FeishuApi } from './api';
import type { FeishuBitableSourceOptions } from '../../../types';

export type BitableSourceOptions = Pick<FeishuBitableSourceOptions, 'url' | 'appToken' | 'tableId'>;

/** A Bitable app, and the table to load when the source names one. */
export interface BitableTarget {
  appToken: string;
  tableId?: string;
}

function pickTableId(linkTableId: string | undefined, optionTableId: string | undefined): string | undefined {
  if (linkTableId && optionTableId && linkTableId !== optionTableId) {
    throw new Error('Feishu Bitable tableId does not match url.');
  }
  return linkTableId ?? optionTableId;
}

/**
 * Resolve a Feishu source to the Bitable app token the API needs.
 *
 * `/base/<appToken>` links already carry the app token, while `/wiki/<nodeToken>`
 * links carry a wiki node token whose hosted object has to be looked up first.
 * The table comes from `?table=` or `tableId`; without one the whole base is loaded.
 */
export async function resolveBitable(options: BitableSourceOptions, api: FeishuApi): Promise<BitableTarget> {
  if (!options.url) {
    if (!options.appToken) {
      throw new Error('Feishu Bitable url or appToken must be provided');
    }
    return { appToken: options.appToken, tableId: options.tableId };
  }

  const link = parseTableLink(options.url);
  if (!link) {
    throw new Error('Invalid Feishu Bitable URL.');
  }
  const tableId = pickTableId(link.tableId, options.tableId);

  if (link.kind === 'base') {
    if (options.appToken && options.appToken !== link.token) {
      throw new Error('Feishu Bitable appToken does not match url.');
    }
    return { appToken: link.token, tableId };
  }

  const node = await resolveWikiNode(link.token, api);
  if (node.objType !== 'bitable') {
    const label = node.title ? ` (${node.title})` : '';
    throw new Error(
      `Feishu wiki node${label} hosts a ${node.objType}, not a Bitable (多维表格). Only wiki-hosted Bitable nodes can be loaded.`
    );
  }
  if (options.appToken && options.appToken !== node.objToken) {
    throw new Error("Feishu Bitable appToken does not match the wiki node's table.");
  }
  return { appToken: node.objToken, tableId };
}
