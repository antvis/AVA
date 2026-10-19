import { z } from 'zod/v4';

import { stringifySchema } from '../../util/context';

import { generateCandidate } from './agent';
import { retrieveGuidance } from './guidance';
import { linkSchema } from './linking';
import { apexRuntime } from './runtime';

import type { AnalysisStrategy, ApexCandidate, ApexTrace } from '../../types';

/** Preserve column order, row order and duplicate multiplicity when grouping results. */
export function resultKey(candidate: ApexCandidate): string {
  return JSON.stringify({
    columns: candidate.schema.length,
    rows: candidate.data.map((row) => candidate.schema.map(({ name }) => row[name])),
  });
}

export function votingLeaders(candidates: ApexCandidate[]): number[] {
  const groups = new Map<string, number[]>();
  candidates.forEach((candidate, i) => {
    const key = resultKey(candidate);
    groups.set(key, [...(groups.get(key) ?? []), i]);
  });
  const size = Math.max(...[...groups.values()].map((group) => group.length));
  return [...groups.values()].filter((group) => group.length === size).map((group) => group[0]);
}

export const apexAnalysis: AnalysisStrategy = async (query, config, baseRuntime) => {
  if (config.strategy?.type !== 'apex') throw new Error('Expected apex strategy configuration');
  const options = config.strategy;
  for (const [name, value, min, max] of [
    ['maxSteps', options.maxSteps ?? 40, 2, 100],
    ['maxContextTokens', options.maxContextTokens ?? 56 * 1024, 1024, 200000],
    ['samples', options.samples ?? 1, 1, 8],
    ['concurrency', options.concurrency ?? 2, 1, 8],
  ] as const) {
    if (!Number.isInteger(value) || value < min || value > max)
      throw new Error(`APEX ${name} must be an integer from ${min} to ${max}`);
  }
  if (baseRuntime.engine.language.fence !== 'sql') throw new Error('APEX requires a SQL engine');
  const events: ApexTrace['events'] = [];
  const runtime = apexRuntime(baseRuntime, events);
  const { plan, schema, profiles } = await linkSchema(query, options, runtime);
  const reference = JSON.stringify({
    question: query,
    plan,
    evidence: options.evidence ?? '',
    descriptions: options.schemaDescriptions ?? '',
  });
  const realizations =
    options.ablation === 'no-guidance'
      ? ''
      : await runtime.reason(
          'sql-realizations',
          `Map each logical step to plausible SQL operations in ${
            runtime.engine.language.name
          }, explicitly naming operation keywords (JOIN, RANK, division, date, etc.) and uncertainties to verify.\n${reference}\n${stringifySchema(
            schema
          )}`
        );
  const guidance = options.ablation === 'no-guidance' ? [] : retrieveGuidance(realizations, options.evidence ?? '');
  runtime.record('guidance', guidance);
  const input = `${reference}\nLinked schema:\n${stringifySchema(schema)}\nSchema observations: ${JSON.stringify(
    profiles
  )}\nExploration guidance: ${JSON.stringify(guidance)}`;
  const candidates: ApexCandidate[] = [];
  const traces: ApexTrace['candidates'] = [];
  const successfulIndexes: number[] = [];
  for (let i = 0; i < (options.samples ?? 1); i++) {
    runtime.record('candidate-start', { candidate: i });
    try {
      const candidate = await generateCandidate(input, config, options, runtime);
      candidates.push(candidate);
      successfulIndexes.push(i);
      traces.push({ sql: candidate.sql, confirmation: candidate.confirmation });
    } catch (error) {
      traces.push({ error: String(error) });
      runtime.record('candidate-failed', { candidate: i, error: String(error) });
    }
  }
  if (!candidates.length) throw new Error(`All APEX candidates failed: ${traces.map(({ error }) => error).join('; ')}`);
  let selected: number;
  if (options.selectCandidate) {
    selected = await options.selectCandidate(candidates);
  } else {
    const leaders = votingLeaders(candidates);
    selected =
      leaders.length === 1
        ? leaders[0]
        : (
            await runtime.infer(
              'vote-tiebreak',
              `Choose the most faithful SQL for the question using the linked schema and evidence. Return its index.\n${input}\nTied candidates: ${JSON.stringify(
                leaders.map((index) => ({
                  index,
                  sql: candidates[index].sql,
                  verification: candidates[index].confirmation,
                }))
              )}`,
              z.object({
                index: z
                  .number()
                  .int()
                  .refine((value) => leaders.includes(value), 'Must select a tied candidate'),
              })
            )
          ).index;
  }
  if (!Number.isInteger(selected) || selected < 0 || selected >= candidates.length)
    throw new Error('APEX candidate selector returned an invalid index');
  const { confirmation, ...result } = candidates[selected];
  runtime.record('selected-candidate', {
    candidate: successfulIndexes[selected],
    method: options.selectCandidate ? 'external-selector' : 'result-vote',
  });
  return {
    ...result,
    query,
    text: config.includeSummary === false ? '' : confirmation,
    apex: { plan, schema, guidance, candidates: traces, selected: successfulIndexes[selected], events },
  };
};
