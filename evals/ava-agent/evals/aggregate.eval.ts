import { defineEval } from 'eve/evals';

import { checkAnswer, delivery } from './shared.js';

export default defineEval({
  description: 'Aggregate only paid line amounts by region; do not include refunds.',
  tags: ['qa'],

  async test(t) {
    const session = await t.session();

    const turn = await session.sendFile(
      'Analyze the attached sales.csv. Each row is an order line, amount is the line amount, ' +
      'and paid means status equals paid. Sum paid amounts by region; ignore missing amounts. ' +
      'Return an object whose keys are region names and values are totals.' + delivery,
      'evals/fixtures/sales.csv',
      'text/csv'
    );

    checkAnswer(t, turn, { East: 50, West: 80 });
  },
});
