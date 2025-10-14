import { matchGraph, matchTree } from '@ava/data/infer';

describe('isGraphLike', () => {
  const graphLikeData1 = [
    { id: 'A', label: '用户中心', type: 'service', group: 'backend', size: 20 },
    { id: 'B', label: '订单系统', type: 'service', group: 'backend', size: 18 },
    { id: 'C', label: '支付网关', type: 'service', group: 'payment', size: 16 },
    { id: 'D', label: '库存服务', type: 'service', group: 'inventory', size: 15 },
    { id: 'E', label: '物流系统', type: 'service', group: 'logistics', size: 17 },
    { id: 'F', label: '推荐引擎', type: 'service', group: 'ai', size: 14 },
    { id: 'G', label: '风控系统', type: 'service', group: 'security', size: 13 },
    { id: 'H', label: '数据库', type: 'database', group: 'storage', size: 19 },
    { id: 'I', label: '缓存 Redis', type: 'cache', group: 'storage', size: 12 },
    { id: 'J', label: '前端 Web', type: 'frontend', group: 'client', size: 10 },
    { id: 'K', label: '移动端 App', type: 'mobile', group: 'client', size: 11 },
    { id: 'L', label: 'API 网关', type: 'gateway', group: 'infrastructure', size: 16 },
    { source: 'J', target: 'L', type: 'http', weight: 0.8 },
    { source: 'K', target: 'L', type: 'http', weight: 0.7 },
    { source: 'L', target: 'A', type: 'rpc', weight: 0.9 },
    { source: 'L', target: 'B', type: 'rpc', weight: 0.95 },
    { source: 'B', target: 'C', type: 'rpc', weight: 0.85 },
    { source: 'B', target: 'D', type: 'rpc', weight: 0.75 },
    { source: 'C', target: 'H', type: 'write', weight: 0.9 },
    { source: 'D', target: 'H', type: 'read', weight: 0.6 },
    { source: 'B', target: 'E', type: 'event', weight: 0.7 },
    { source: 'A', target: 'F', type: 'query', weight: 0.5 },
    { source: 'F', target: 'J', type: 'data', weight: 0.6 },
    { source: 'C', target: 'G', type: 'verify', weight: 0.8 },
    { source: 'G', target: 'C', type: 'approve', weight: 0.78 },
    { source: 'A', target: 'I', type: 'cache-get', weight: 0.65 },
    { source: 'I', target: 'A', type: 'cache-hit', weight: 0.6 },
    { source: 'H', target: 'I', type: 'sync', weight: 0.4 },
    { source: 'E', target: 'K', type: 'push', weight: 0.5 },
  ];

  const graphLikeData2 = {
    nodes: [
      { id: 'H', label: '数据库', type: 'database', group: 'storage', size: 19 },
      { id: 'I', label: '缓存 Redis', type: 'cache', group: 'storage', size: 12 },
      { id: 'J', label: '前端 Web', type: 'frontend', group: 'client', size: 10 },
    ],
    links: [
      { source: 'C', target: 'G', type: 'verify', weight: 0.8 },
      { source: 'G', target: 'C', type: 'approve', weight: 0.78 },
      { source: 'A', target: 'I', type: 'cache-get', weight: 0.65 },
    ],
  };

  const graphLikeData3 = {
    nodes: [
      { id: 'H', label: '数据库', type: 'database', group: 'storage', size: 19 },
      { id: 'I', label: '缓存 Redis', type: 'cache', group: 'storage', size: 12 },
      { id: 'J', label: '前端 Web', type: 'frontend', group: 'client', size: 10 },
    ],
    links: [
      { source: 'C', target: 'G', type: 'verify', weight: 0.8 },
      { source: 'G', target: 'C', type: 'approve', weight: 0.78 },
      { source: 'A', target: 'I', type: 'cache-get', weight: 0.65 },
    ],
    helloe: {},
  };

  const graphLikeData4 = {
    nodes: [
      { id: 'H', label: '数据库', type: 'database', group: 'storage', size: 19 },
      { id: 'I', label: '缓存 Redis', type: 'cache', group: 'storage', size: 12 },
      { id: 'J', label: '前端 Web', type: 'frontend', group: 'client', size: 10, value: 233, ii23: '24049' },
    ],
    links: [
      { source: 'C', target: 'G', type: 'verify', weight: 0.8 },
      { source: 'G', target: 'C', type: 'approve', weight: 0.78 },
      { source: 'A', target: 'I', type: 'cache-get', weight: 0.65 },
    ],
    helloe: {},
  };

  const notGraphLikeData1 = {
    nodes: [
      { a: 'feww', b: 'cewwe' },
      { keii: 'feww', sk934: '2332', pp: '02388' },
    ],
    links: [
      { ii38: 'feww', b: 'cewwe' },
      { a: 'feww', yes: '22323' },
      { c: 122, b: 23333 },
    ],
  };

  test('returns true for a array shape graph-like input', () => {
    expect(matchGraph(graphLikeData1).is).toBe(true);
  });

  test('return true for a object shape graph-like input', () => {
    expect(matchGraph(graphLikeData2).is).toBe(true);
  });

  test('return true for a object shape graph-like input with extra properties', () => {
    expect(matchGraph(graphLikeData3).is).toBe(true);
  });

  test('return true for a object shape graph-like input with extra properties and some extra key', () => {
    expect(matchGraph(graphLikeData4).is).toBe(true);
  });

  test('return false for a object shape graph-like input with extra properties', () => {
    expect(matchGraph(notGraphLikeData1).is).toBe(false);
  });
});

describe('matchTree', () => {
  const treeLikeData1 = {
    id: '1',
    value: 2323,
    children: [
      {
        id: '2',
        value: 343,
      },
      {
        id: '3',
        value: 233,
      },
    ],
  };

  const treeLikeData2 = [
    {
      id: '1',
      value: 2323,
      children: [
        {
          id: '2',
          value: 343,
        },
        {
          id: '3',
          value: 233,
        },
      ],
    },
  ];

  const treeLikeData3 = [
    { id: '1', children: ['2', '3', '4'] },
    { id: '2', children: ['5'] },
    { id: '3', children: ['6'] },
    { id: '4', children: ['7'] },
    { id: '5', value: 2332 },
    { id: '6', value: 2332 },
    { id: '7', value: 2332 },
  ];

  it('returns true for a tree-like object', () => {
    expect(matchTree(treeLikeData1).is).toBe(true);
  });

  it('returns true for a tree-like array with mutiple root', () => {
    expect(matchTree(treeLikeData2).is).toBe(true);
  });

  /**
   * the key all element contain maybe is id,
   */
  it('returns true for a tree-like array with children linked', () => {
    expect(matchTree(treeLikeData3).is).toBe(true);
  });
});
