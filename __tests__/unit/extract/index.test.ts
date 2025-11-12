import _ from 'lodash';
import { extract } from '../../../src/extract';

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

    const llmAuth = process.env.TBOX_LLM_AUTH || '';
    const llmAppId = process.env.TBOX_LLM_APP_ID || '';
    const result = await extract(input, {
      llmConfig: {
        authorization: llmAuth,
        appId: llmAppId,
      },
    });
    const shard = result?.[0];
    expect(shard.shape).toBe('plain');
    expect(shard.data).toEqual([
      { 用户ID: 1001, 姓名: '张三', 年龄: 25 },
      { 用户ID: 1002, 姓名: '李四', 年龄: 30 },
      { 用户ID: 1003, 姓名: '王五', 年龄: 28 },
      { 用户ID: 1004, 姓名: '赵六', 年龄: 35 },
    ]);
    expect(
      shard.metas.map((v) => {
        return {
          id: String(v.id),
          name: v.name,
          dataType: v.dataType,
        };
      })
    ).toEqual([
      { id: '用户ID', name: '用户ID', dataType: 'number' },
      { id: '姓名', name: '姓名', dataType: 'string' },
      { id: '年龄', name: '年龄', dataType: 'number' },
    ]);
  });
});
