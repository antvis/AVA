import { defineEval } from 'eve/evals';

import { checkAnswer, delivery } from './shared.js';

export default defineEval({
  description: 'Distinguish order lines, distinct customers, zero amounts, and missing amounts.',
  tags: ['qa'],

  async test(t) {
    const session = await t.session();

    const turn = await session.sendFile(
      'Analyze the attached sales.csv using only rows with status paid. Each row is an order line. ' +
      'Count distinct non-empty customer_id values, and calculate the average line amount ' +
      'excluding missing amounts but including zero. ' +
      'Return an object with numeric fields distinct_customers and average_line_amount.' + delivery,
      'evals/fixtures/sales.csv',
      'text/csv'
    );

    checkAnswer(t, turn, { distinct_customers: 3, average_line_amount: 26 });
  },
});
