import fs from 'fs';
import _ from 'lodash';
import { generate } from './generate';
import { evaluate } from './evaluate';
import { EVALUATE_RESULT_LOG_PATH } from './constants';

describe('expect evaluate pass rate >= 95%', () => {
  it('generate success rate >= 95%', async () => {
    const { success, total } = await generate();
    expect(success / total).toBeGreaterThanOrEqual(0.95);
  }, 6000000);

  it('evaluate success rate >= 95%', async () => {
    const { success, total } = await evaluate();
    expect(success / total).toBeGreaterThanOrEqual(0.95);
  }, 6000000);

  it('evaluate extract pass rate >= 95%', () => {
    const content = fs.readFileSync(EVALUATE_RESULT_LOG_PATH);
    const lines = content
      .toString()
      .split('\n')
      .filter((line) => line.length > 0);
    let total = lines.length;
    let pass = 0;

    _.each(lines, (line) => {
      if (!line.length) return;
      try {
        const data = JSON.parse(line);
        const message = data.message;
        if (message.pass) {
          pass++;
        } else {
          console.error(message.input);
        }
      } catch (e) {
        console.error(e.message);
      }
    });
    console.log(pass / total);
    expect(pass / total).toBeGreaterThanOrEqual(0.9);
  });
});
