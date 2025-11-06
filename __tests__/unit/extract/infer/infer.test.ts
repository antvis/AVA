import { matchDataShape } from '../../../../src/extract/infer';
import { DATA_SHAPE } from '../../../../src/types';

describe('test matchDataShape', () => {
  const listData1 = [
    ['A', 'B', 'C', 9],
    ['D', 'E', 'F', 2],
    ['G', 'H', 'I', 63],
  ];

  test('returns true for a list-data input', () => {
    const matchRes = matchDataShape(listData1);
    expect(matchRes.shape).toBe(DATA_SHAPE.PLAIN);
  });

  const listData2 = [
    { id: 'A', label: '用户中心', type: 'service', group: 'backend', size: 20 },
    { id: 'B', label: '订单系统', type: 'service', group: 'backend', size: 18 },
    { id: 'C', label: '支付网关', type: 'service', group: 'payment', size: 16 },
  ];

  test('returns true for a list-data input', () => {
    const matchRes = matchDataShape(listData2);
    expect(matchRes.shape).toBe(DATA_SHAPE.PLAIN);
  });

  const relationLikeData = [
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

  test('returns true for a array shape graph-like input', () => {
    const matchRes = matchDataShape(relationLikeData);
    expect(matchRes.shape).toBe(DATA_SHAPE.RELATION);
  });

  const relationLikeData2 = {
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

  test('returns true for a object shape graph-like input', () => {
    const matchRes = matchDataShape(relationLikeData2);
    expect(matchRes.shape).toBe(DATA_SHAPE.RELATION);
  });

  const relationLikeData3 = {
    nodes: [
      { level: 'H', label: '数据库', type: 'database', group: 'storage', size: 19 },
      { level: 'I', label: '缓存 Redis', type: 'cache', group: 'storage', size: 12 },
      { level: 'J', label: '前端 Web', type: 'frontend', group: 'client', size: 10 },
    ],
    edges: [
      { s: 'C', t: 'G', type: 'verify', weight: 0.8 },
      { s: 'G', t: 'C', type: 'approve', weight: 0.78 },
      { s: 'A', t: 'I', type: 'cache-get', weight: 0.65 },
    ],
  };

  test('returns true for a object shape graph-like input with other keys', () => {
    const matchRes = matchDataShape(relationLikeData3);
    expect(matchRes.shape).toBe(DATA_SHAPE.RELATION);
  });

  const relationLikeData4 = {
    nodes: [
      { id: 'H', label: '数据库', type: 'database', group: 'storage', size: 19 },
      { id: 'I', label: '缓存 Redis', type: 'cache', group: 'storage', size: 12, fas: '23409' },
      { id: 'J', label: '前端 Web', type: 'frontend', group: 'client', size: 10, value: 233, ii23: '24049' },
    ],
    links: [
      { source: 'C', target: 'G', type: 'verify', weight: 0.8 },
      { source: 'G', target: 'C', type: 'approve', weight: 0.78 },
      { source: 'A', target: 'I', type: 'cache-get', weight: 0.65 },
    ],
  };

  test('returns true for a object shape graph-like input with redundant keys', () => {
    const matchRes = matchDataShape(relationLikeData4);
    expect(matchRes.shape).toBe(DATA_SHAPE.RELATION);
  });

  const relationLikeData5 = [
    { id: 1, name: '张三', age: 25 },
    { id: 2, name: '李四', age: 30 },
    { id: 3, name: '王五', age: 28 },
    { id: 4, name: '赵六', age: 35 },
    { source: 1, target: 3, relation: '朋友' },
    { source: 2, target: 4, relation: '同事' },
    { source: 3, target: 4, relation: '同事' },
  ];

  test('returns true for a relation like array input', () => {
    const matchRes = matchDataShape(relationLikeData5);
    expect(matchRes.shape).toBe(DATA_SHAPE.RELATION);
  });
});
