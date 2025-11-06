import { extractData } from '../../../src/extract';
import USER from './user.json';

const EVALUATE_CASES = [USER];

describe('extract evaluation', () => {
  it('pass rate > 98%', async () => {
    const total = EVALUATE_CASES.length;
    let pass = 0;

    for (const testCase of EVALUATE_CASES) {
      const { input, expect } = testCase;

      // TODO: should use new Advisor().extract API
      const result = await extractData(input, {
        llmConfig: {
          authorization: process.env.OPENAI_API_KEY || '',
          appId: process.env.TBOX_APP_ID || '',
        },
      });

      if (result.length === expect.length) {
        pass++;
      } else {
        console.error(`extract evaluation failed. expect length: ${expect.length}, got length: ${result.length}`);
      }
    }

    expect(pass / total).toBeGreaterThan(0.98);
  });
});
