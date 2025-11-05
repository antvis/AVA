import type { MatchFunction } from '@ava/types';

/**
 * 计算单个对象作为节点的相似度得分
 */
function calculateObjectNodeSimilarity(obj: Record<string, any>): number {
  const keys = Object.keys(obj);
  if (keys.length === 0) return 0;

  // 节点特征向量：包含标识性字段、描述性字段等
  const nodeFeatures = new Set([
    'id',
    'name',
    'label',
    'title',
    'key',
    'identifier',
    'uuid',
    'type',
    'category',
    'properties',
    'data',
    'value',
    'text',
  ]);

  let matchCount = 0;
  for (const key of keys) {
    if (nodeFeatures.has(key.toLowerCase())) {
      matchCount++;
    }
  }

  // 相似度得分 = 匹配的特征数 / 总特征数（归一化到0-1）
  return matchCount / Math.max(nodeFeatures.size, keys.length);
}

/**
 * 计算单个对象作为边的相似度得分
 */
function calculateObjectEdgeSimilarity(obj: Record<string, any>): number {
  const keys = Object.keys(obj);
  if (keys.length === 0) return 0;

  // 边特征向量：包含连接性字段
  const edgeFeatures = new Set([
    'source',
    'target',
    'from',
    'to',
    'f',
    't',
    'start',
    'end',
    'origin',
    'destination',
    'src',
    'dest',
    'parent',
    'child',
  ]);

  let matchCount = 0;
  for (const key of keys) {
    if (edgeFeatures.has(key.toLowerCase())) {
      matchCount++;
    }
  }

  // 边通常只有2-4个字段，如果字段过多可能不是边
  const fieldCountPenalty = keys.length > 6 ? 0.5 : 1;

  return (matchCount / Math.max(edgeFeatures.size, keys.length)) * fieldCountPenalty;
}

/**
 * 计算数组作为节点的可能性得分（基于向量相似度）
 */
function calculateNodeLikelihood(arr: any[]): number {
  if (arr.length === 0) return 0;

  // 取前几个样本进行分析
  const sampleSize = Math.min(5, arr.length);
  const samples = arr.slice(0, sampleSize);

  let totalScore = 0;
  let validSamples = 0;

  for (const item of samples) {
    if (typeof item !== 'object' || item === null) continue;

    const keys = Object.keys(item);
    if (keys.length === 0) continue;

    // 计算该对象作为节点的相似度得分
    const nodeScore = calculateObjectNodeSimilarity(item);
    totalScore += nodeScore;
    validSamples++;
  }

  return validSamples > 0 ? totalScore / validSamples : 0;
}

/**
 * 从混合数组中提取节点和边（使用向量相似度）
 */
function extractNodesAndEdgesFromMixed(mixedArray: any[]): {
  extractedNodes: any[];
  extractedEdges: any[];
} {
  const nodes: any[] = [];
  const edges: any[] = [];

  for (const item of mixedArray) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }

    const nodeSimilarity = calculateObjectNodeSimilarity(item);
    const edgeSimilarity = calculateObjectEdgeSimilarity(item);

    if (nodeSimilarity > edgeSimilarity) {
      nodes.push(item);
    } else if (edgeSimilarity > 0) {
      edges.push(item);
    } else {
      const keys = Object.keys(item);
      if (keys.length <= 3 && Object.values(item).every((val) => typeof val === 'string')) {
        edges.push(item);
      } else {
        nodes.push(item);
      }
    }
  }

  return { extractedNodes: nodes, extractedEdges: edges };
}

/**
 * 使用向量相似度找到最佳的 ID 字段
 */
function findBestIdField(obj: Record<string, any>): string | null {
  const keys = Object.keys(obj);
  if (keys.length === 0) return null;

  const idCandidates = [
    { key: 'id', weight: 1.0 },
    { key: 'name', weight: 0.9 },
    { key: 'key', weight: 0.8 },
    { key: 'identifier', weight: 0.8 },
    { key: 'uuid', weight: 0.7 },
    { key: 'label', weight: 0.6 },
    { key: 'title', weight: 0.6 },
  ];

  let bestField: string | null = null;
  let bestScore = 0;

  for (const key of keys) {
    const lowerKey = key.toLowerCase();
    const candidate = idCandidates.find((c) => c.key === lowerKey);

    if (candidate && obj[key] != null) {
      const value = obj[key];
      // 值应该是字符串或数字
      if (typeof value === 'string' || typeof value === 'number') {
        const score = candidate.weight;
        if (score > bestScore) {
          bestScore = score;
          bestField = key;
        }
      }
    }
  }

  return bestField;
}

/**
 * 使用向量相似度找到最佳的 source 字段
 */
function findBestSourceField(obj: Record<string, any>): string | null {
  const keys = Object.keys(obj);
  if (keys.length === 0) return null;

  const sourceCandidates = [
    { key: 'source', weight: 1.0 },
    { key: 'from', weight: 0.9 },
    { key: 'f', weight: 0.8 },
    { key: 'start', weight: 0.7 },
    { key: 'origin', weight: 0.7 },
    { key: 'src', weight: 0.8 },
    { key: 'parent', weight: 0.6 },
    { key: 's', weight: 0.6 },
  ];

  let bestField: string | null = null;
  let bestScore = 0;

  for (const key of keys) {
    const lowerKey = key.toLowerCase();
    const candidate = sourceCandidates.find((c) => c.key === lowerKey);

    if (candidate && obj[key] != null) {
      const value = obj[key];
      if (typeof value === 'string' || typeof value === 'number') {
        const score = candidate.weight;
        if (score > bestScore) {
          bestScore = score;
          bestField = key;
        }
      }
    }
  }

  return bestField;
}

/**
 * 使用向量相似度找到最佳的 target 字段
 */
function findBestTargetField(obj: Record<string, any>): string | null {
  const keys = Object.keys(obj);
  if (keys.length === 0) return null;

  const targetCandidates = [
    { key: 'target', weight: 1.0 },
    { key: 'to', weight: 0.9 },
    { key: 't', weight: 0.8 },
    { key: 'end', weight: 0.7 },
    { key: 'destination', weight: 0.7 },
    { key: 'dest', weight: 0.8 },
    { key: 'child', weight: 0.6 },
  ];

  let bestField: string | null = null;
  let bestScore = 0;

  for (const key of keys) {
    const lowerKey = key.toLowerCase();
    const candidate = targetCandidates.find((c) => c.key === lowerKey);

    if (candidate && obj[key] != null) {
      const value = obj[key];
      if (typeof value === 'string' || typeof value === 'number') {
        const score = candidate.weight;
        if (score > bestScore) {
          bestScore = score;
          bestField = key;
        }
      }
    }
  }

  return bestField;
}

/**
 * 生成备用 ID（当找不到合适的 ID 字段时）
 */
function generateFallbackId(obj: Record<string, any>): string {
  // 尝试组合多个字段生成唯一 ID
  const keys = Object.keys(obj).sort();
  const values = keys.map((key) => String(obj[key])).join('|');

  if (values) {
    // 简单的哈希生成（实际项目中可能需要更复杂的哈希）
    let hash = 0;
    for (let i = 0; i < values.length; i++) {
      const char = values.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash; // 转换为32位整数
    }
    return `node_${Math.abs(hash).toString(36)}`;
  }

  return `node_unknown_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 判断输入数据是否为图结构，并标准化为统一格式
 * 使用向量相似度来识别节点和边结构
 * @param data - 待检测的数据
 * @returns 标准化的图结构数据或判断结果
 */
export const matchRelation: MatchFunction = (data: any) => {
  if (data == null) {
    return { is: false, format: { data: {} } };
  }

  let nodes: any[] = [];
  let edges: any[] = [];

  if (typeof data === 'object' && !Array.isArray(data)) {
    const arrayFields = Object.entries(data).filter(([_, value]) => Array.isArray(value));

    if (arrayFields.length === 2) {
      const [field1, field2] = arrayFields;
      const [score1, score2] = [
        calculateNodeLikelihood(field1[1] as any[]),
        calculateNodeLikelihood(field2[1] as any[]),
      ];

      if (score1 >= score2) {
        nodes = field1[1] as any[];
        edges = field2[1] as any[];
      } else {
        nodes = field2[1] as any[];
        edges = field1[1] as any[];
      }
    } else if (arrayFields.length === 1) {
      const mixedArray = arrayFields[0][1];
      const { extractedNodes, extractedEdges } = extractNodesAndEdgesFromMixed(mixedArray as any);
      nodes = extractedNodes;
      edges = extractedEdges;
    } else {
      // 没有数组字段，尝试其他方式
      return { is: false, format: { data: {} } };
    }
  } else if (Array.isArray(data)) {
    const { extractedNodes, extractedEdges } = extractNodesAndEdgesFromMixed(data);
    nodes = extractedNodes;
    edges = extractedEdges;
  } else {
    return { is: false, format: { data: {} } };
  }

  if (nodes.length === 0 || edges.length === 0) {
    return { is: false, format: { data: {} } };
  }

  const standardizedNodes = nodes.map((node) => {
    if (typeof node !== 'object' || node === null) {
      return { id: node };
    }

    const idField = findBestIdField(node);
    const id = idField ? node[idField] : generateFallbackId(node);

    return { ...node, id };
  });

  // 标准化边：确保每个边都有 source 和 target 字段
  const standardizedEdges = edges.map((edge) => {
    if (typeof edge !== 'object' || edge === null) {
      return { source: '', target: '' };
    }

    // 使用向量相似度找到最可能的 source/target 字段
    const sourceField = findBestSourceField(edge);
    const targetField = findBestTargetField(edge);

    const source = sourceField ? edge[sourceField] : '';
    const target = targetField ? edge[targetField] : '';

    return { ...edge, source, target };
  });

  const hasValidNodes =
    standardizedNodes.length > 0 &&
    standardizedNodes.every(
      (node) =>
        typeof node === 'object' &&
        node !== null &&
        ['string', 'number'].includes(typeof node.id) &&
        String(node.id).trim() !== ''
    );

  const hasValidEdges =
    standardizedEdges.length === 0 ||
    standardizedEdges.every(
      (edge) =>
        typeof edge === 'object' &&
        edge !== null &&
        ['string', 'number'].includes(typeof edge.source) &&
        String(edge.source).trim() !== '' &&
        ['string', 'number'].includes(typeof edge.target) &&
        String(edge.target).trim() !== ''
    );

  const isValid = hasValidNodes && hasValidEdges;

  if (isValid) {
    return {
      is: true,
      format: {
        data: {
          nodes: standardizedNodes,
          edges: standardizedEdges,
        },
      },
    };
  }

  return { is: false, format: { data: {} } };
};
