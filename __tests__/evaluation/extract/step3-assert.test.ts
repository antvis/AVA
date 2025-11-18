import fs from 'fs';
import _ from 'lodash';
import { EVALUATE_RESULT_LOG_PATH } from './constants';

describe('expect evaluate pass rate >= 90%', () => {
  const content = fs.readFileSync(EVALUATE_RESULT_LOG_PATH);
  const lines = content.toString().split('\n');
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

  it('pass rate >= 90%', () => {
    console.log(pass / total);
    expect(pass / total).toBeGreaterThanOrEqual(0.9);
  });
});
