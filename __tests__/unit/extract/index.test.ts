import _ from 'lodash';
import { extractData } from '../../../src/extract';
import { extract } from './mock-extract';

jest.mock('../../../src/extract/extract', () => ({
  __esModule: true,
  extract: jest.fn().mockImplementation(async (value: string) => {
    return await extract(value);
  }),
}));

describe('extractData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle string input by calling extract', async () => {
    const input = `
      请帮我分析如下数据: 
      1. 用户ID: 1001, 姓名: 张三, 年龄: 25 
      2. 用户ID: 1002, 姓名: 李四, 年龄: 30
      3. 用户ID: 1003, 姓名: 王五, 年龄: 28
      4. 用户ID: 1004, 姓名: 赵六, 年龄: 35
    `;

    const result = await extractData(input);
    const shard = result?.[0];
    expect(shard.shape).toBe('plain');
    expect(shard.data).toEqual([
      { 用户ID: 1001, 姓名: '张三', 年龄: 25 },
      { 用户ID: 1002, 姓名: '李四', 年龄: 30 },
      { 用户ID: 1003, 姓名: '王五', 年龄: 28 },
      { 用户ID: 1004, 姓名: '赵六', 年龄: 35 },
    ]);
    expect(shard.metas).toEqual([
      { id: '用户ID', name: '用户ID', dataType: 'number' },
      { id: '姓名', name: '姓名', dataType: 'string' },
      { id: '年龄', name: '年龄', dataType: 'number' },
    ]);
  });

  it('should return plain dataType if input is plain data', async () => {
    const input = [
      { id: 1001, name: '张三', age: 25 },
      { id: 1002, name: '李四', age: 30 },
      { id: 1003, name: '王五', age: 28 },
      { id: 1004, name: '赵六', age: 35 },
    ];
    const result = await extractData(input);
    const shard = result?.[0];
    expect(shard.shape).toBe('plain');
    expect(shard.data).toEqual(input);
    expect(shard.metas.map((v) => ({ id: v.id, name: v.name, dataType: v.dataType }))).toEqual([
      { id: 'id', name: 'id', dataType: 'number' },
      { id: 'name', name: 'name', dataType: 'string' },
      { id: 'age', name: 'age', dataType: 'number' },
    ]);
  });

  it('should return hierarchy dataType if input is hierarchy data', async () => {
    const input = {
      id: 1001,
      name: '集团',
      value: 27,
      departments: [
        { id: 1002, name: '部门A', value: 15 },
        {
          id: 1003,
          name: '部门B',
          value: 12,
          departments: [
            { id: 1004, name: '部门C', value: 8 },
            { id: 1005, name: '部门D', value: 4 },
          ],
        },
      ],
    };
    const result = await extractData(input);
    const shard = result?.[0];
    expect(shard.shape).toBe('hierarchy');
    expect(shard.data).toEqual([
      {
        id: 1001,
        name: '集团',
        value: 27,
        children: [
          { id: 1002, name: '部门A', value: 15 },
          {
            id: 1003,
            name: '部门B',
            value: 12,
            children: [
              { id: 1004, name: '部门C', value: 8 },
              { id: 1005, name: '部门D', value: 4 },
            ],
          },
        ],
      },
    ]);
  });

  it('should return relation dataType if input is relation data', async () => {
    const input = {
      nodes: [
        { id: 1, name: '张三', age: 25 },
        { id: 2, name: '李四', age: 30 },
        { id: 3, name: '王五', age: 28 },
        { id: 4, name: '赵六', age: 35 },
      ],
      edges: [
        { source: 1, target: 3, relation: '朋友' },
        { source: 2, target: 4, relation: '同事' },
        { source: 3, target: 4, relation: '同事' },
      ],
    };
    const input2 = [
      { id: 1, name: '张三', age: 25 },
      { id: 2, name: '李四', age: 30 },
      { id: 3, name: '王五', age: 28 },
      { id: 4, name: '赵六', age: 35 },
      { source: 1, target: 3, relation: '朋友' },
      { source: 2, target: 4, relation: '同事' },
      { source: 3, target: 4, relation: '同事' },
    ];

    const result = await extractData(input);
    const shard = result?.[0];
    expect(shard.shape).toBe('relation');
    expect(shard.data).toEqual(input);

    const result2 = await extractData(input2);
    const shard2 = result2?.[0];
    expect(shard2.shape).toBe('relation');
    expect(shard2.data).toEqual(input);
  });
});
