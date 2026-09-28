import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { defineEval } from 'eve/evals';
import { satisfies } from 'eve/evals/expect';

import { checkAnswer, delivery } from './shared.js';

type ChartSnapshot = {
  chart?: { content: string; truncated: boolean };
  error?: string;
};

export default defineEval({
  description: 'Check region totals and HTML artifact structure, not visual chart correctness.',
  tags: ['chart'],

  async test(t) {
    const session = await t.session();

    const turn = await session.sendFile(
      'Analyze the attached sales.csv. Each row is an order line. ' +
      'Sum amount by region for status paid, ignoring missing amounts. ' +
      'Save a bar or column chart comparing these totals to /workspace/output/chart.html. ' +
      'Create output/ if needed. Also return the region-to-total JSON object.' + delivery,
      'evals/fixtures/sales.csv',
      'text/csv'
    );

    checkAnswer(t, turn, { East: 50, West: 80 });

    const root = process.env.AVA_AGENT_RUN_DIR;
    if (!root) throw new Error('Run through npm run eval, not a remote target.');

    const path = join(root, 'artifacts', encodeURIComponent(turn.sessionId), 'snapshot.json');
    const deadline = Date.now() + 30000;
    let snapshot: ChartSnapshot | undefined;

    // Eve emits the turn event before the collection hook finishes.
    // Leave room for its 10-second command timeout and sandbox/file I/O.
    while (Date.now() < deadline) {
      try {
        snapshot = JSON.parse(await readFile(path, 'utf8'));
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        await t.sleep(100);
      }
    }

    await t.require(
      snapshot,
      satisfies((value) => Boolean(value && !(value as ChartSnapshot).error), 'chart artifact collection succeeded')
    );

    t.check(
      snapshot?.chart,
      satisfies((value) => {
        const chart = value as ChartSnapshot['chart'];

        return Boolean(
          chart &&
          !chart.truncated &&
          /<html[\s>]/i.test(chart.content) &&
          /<script[\s>]|<svg[\s>]|<canvas[\s>]/i.test(chart.content)
        );
      }, 'HTML artifact structure only — not chart correctness or rendering')
    );
  },
});
