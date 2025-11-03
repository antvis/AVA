import { Advisor } from '@antv/ava';

describe('test advisor.advise', () => {
  const appId = process.env.LLM_APP_ID;
  const authorization = process.env.LLM_AUTH;
  const advisor = new Advisor({
    llm: { appId, authorization },
  });

  it('advise by rule with only data', () => {
    /** base line */
    test('one date, one number, should be line', async () => {
      const result = await advisor.advise({
        data: [
          { year: '1999', value: 2 },
          { year: '2000', value: 1 },
          { year: '2001', value: 4 },
          { year: '2002', value: 3 },
          { year: '2003', value: 8 },
        ],
        disableModel: true,
      });
      const type = result[0]?.adviseCharts?.[0].type;
      expect(type).toBe('line');
    });

    test('one date like, one number, should be line', async () => {
      const result = await advisor.advise({
        data: [
          { year: 1999, value: 2 },
          { year: 2000, value: 1 },
          { year: 2001, value: 4 },
          { year: 2002, value: 3 },
          { year: 2003, value: 8 },
        ],
        disableModel: true,
      });
      const type = result[0]?.adviseCharts?.[0].type;
      expect(type).toBe('line');
    });

    /** base column */
  });
});
