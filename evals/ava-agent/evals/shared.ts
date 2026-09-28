import { equals } from 'eve/evals/expect';
import type { EveEvalContext, EveEvalTurn } from 'eve/evals';

export const delivery = ' Return only the requested JSON object in your final reply, without Markdown fences or additional text.';

export function checkAnswer(t: EveEvalContext, turn: EveEvalTurn, expected: unknown) {
  t.succeeded();
  t.calledTool('python');
  t.maxToolCalls(30);

  // Skill activation is diagnostic, not a requirement for a correct answer.
  if (process.env.AVA_AGENT_SKILL === 'ava') {
    t.loadedSkill('ava').soft();
  } else {
    t.notCalledTool('load_skill');
  }

  let parsed: unknown;
  let validJSON = true;

  try {
    parsed = JSON.parse(turn.message ?? '');
  } catch {
    validJSON = false;
  }

  t.check(validJSON, equals(true)).label('valid final JSON');

  if (validJSON) {
    t.check(parsed, equals(expected)).label('answer correctness');
  }
}
