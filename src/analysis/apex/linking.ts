import { ToolLoopAgent, isStepCount, tool } from 'ai';
import { z } from 'zod/v4';

import { stringifySchema } from '../../util/context';

import { DATA_INSTRUCTIONS, observation, parallelMap } from './runtime';
import { columnSelection, columns, connectSchema, prune, schemaBatches, validateColumns } from './schema';

import type { ApexStrategyConfig, Schema, TableSchema } from '../../types';
import type { ApexRuntime } from './runtime';

const reasoning = z.object({ reasoning: z.string().min(1) });

async function profileTable(table: TableSchema, input: string, runtime: ApexRuntime) {
  const observations: unknown[] = [];
  let report: string | undefined;
  let step = 0;
  let actionStep = -1;
  const agent = new ToolLoopAgent({
    model: runtime.model,
    instructions: `${DATA_INSTRUCTIONS}
Verify the hypothesized roles of this table's columns with small queries in ${runtime.engine.language.name}.
Use only the provided table/columns. Call exactly one tool per turn. Report observed evidence, uncertainties and columns needed for filters, output and joins. Never treat absence from a sample as proof of absence.
${runtime.engine.language.instructions ?? ''}`,
    maxRetries: runtime.llm.maxRetries ?? 3,
    maxOutputTokens: 2048,
    toolChoice: 'required',
    stopWhen: [isStepCount(4), () => report !== undefined],
    prepareStep: ({ stepNumber }) => {
      step = stepNumber;
      return step === 3 ? { toolChoice: { type: 'tool', toolName: 'report' } } : {};
    },
    onStepEnd: ({ usage }) => {
      runtime.llm.onQueryUsage?.(usage);
    },
    tools: {
      explore: tool({
        description: 'Execute one read-only query to verify a specific hypothesis about this table.',
        inputSchema: z.object({ hypothesis: z.string().min(1), sql: z.string().min(1) }),
        execute: async ({ hypothesis, sql }) => {
          if (actionStep === step || step === 3)
            throw new Error('Only one action per turn; the last turn must report.');
          actionStep = step;
          try {
            const result = observation(
              await runtime.execute(sql, { maxRows: 1000, maxResultBytes: 65536 }, `profile:${table.name}`)
            );
            observations.push({ hypothesis, sql, result });
            return result;
          } catch (error) {
            const result = { hypothesis, sql, error: String(error) };
            observations.push(result);
            return result;
          }
        },
      }),
      report: tool({
        description: 'Finish this table investigation with evidence and unresolved uncertainties.',
        inputSchema: reasoning,
        execute: async ({ reasoning: text }) => {
          if (actionStep === step) throw new Error('Report only after reading the previous tool results.');
          actionStep = step;
          report = text;
          return { reported: true };
        },
      }),
    },
  });
  await agent.generate({ prompt: `${input}\nTable:\n${stringifySchema({ tables: [table] })}` });
  const result = {
    table: table.name,
    observations,
    report: report ?? 'Budget exhausted; use only the recorded observations.',
  };
  runtime.record('profile-report', result);
  return result;
}

export async function linkSchema(question: string, options: ApexStrategyConfig, runtime: ApexRuntime) {
  const full = runtime.context.schema;
  if (!full.tables.length) throw new Error('APEX requires a non-empty schema');
  let plan = question;
  if (options.ablation !== 'no-planning') {
    const plans = await parallelMap([0, 1], 2, async (i) =>
      runtime.reason(
        `plan:${i}`,
        `Build a schema-agnostic logical plan for the question. Identify entities, constraints, computations, intermediate steps and output. Do not guess physical column names.\nQuestion: ${question}`,
        0.8
      )
    );
    plan = await runtime.reason(
      'plan-merge',
      `Combine these independent plans into one coherent plan. Resolve conflicts against the question, preserving necessary intermediate steps.\nQuestion: ${question}\nPlans: ${JSON.stringify(
        plans
      )}`
    );
  }
  const reference = JSON.stringify({
    question,
    plan,
    evidence: options.evidence ?? '',
    descriptions: options.schemaDescriptions ?? '',
  });
  const batches = await parallelMap(schemaBatches(full), options.concurrency ?? 2, async (batch) => {
    const input = `${reference}\nSchema:\n${stringifySchema(batch)}`;
    const [negative, positive] = await parallelMap(['negative', 'positive'], 2, async (pass) =>
      runtime.infer(
        `prune:${pass}`,
        `${
          pass === 'negative'
            ? 'List only columns confidently irrelevant to the task. Keep uncertain columns and possible join keys.'
            : 'List columns that may be needed for output, filters, computations, entity identity or joining, including bridge tables. For COUNT(*) preserve at least one column of the relevant table.'
        }\nPreserve every operand of formulas explicitly supplied in evidence; similarly named precomputed metrics are not substitutes. Return exact table/column names.\n${input}`,
        columnSelection
      )
    );
    return prune(batch, negative.columns, positive.columns);
  });
  const prunedColumns = batches.flatMap(columns);
  // An empty selection contains no useful evidence for discarding the entire database.
  const pruned = connectSchema(full, prunedColumns.length ? prunedColumns : columns(full));
  const roles = await runtime.reason(
    'semantic-roles',
    `Hypothesize how each candidate table and column contributes to the logical plan. Distinguish hypotheses from facts needing data verification.\n${reference}\n${stringifySchema(
      pruned
    )}`
  );
  const profiles =
    options.ablation === 'no-exploration'
      ? []
      : await parallelMap(pruned.tables, options.concurrency ?? 2, (table) =>
          profileTable(table, `${reference}\nHypothesized roles: ${roles}`, runtime)
        );
  const selected = await runtime.infer(
    'global-synthesis',
    `Select the sufficient schema for answering the question using the evidence below. Preserve every operand in the evidence's explicit formulas; do not replace them with precomputed metrics. Check output/filter/aggregation columns and complete join paths, including bridge tables and composite keys. Recover missing dependencies from the full schema when needed. Missing observations are not proof of irrelevance. For COUNT(*) keep at least one identifying column. Return at least one column, using exact table/column names.\n${reference}\nRoles: ${roles}\nObservations: ${JSON.stringify(
      profiles
    )}\nFull schema:\n${stringifySchema(full)}`,
    columnSelection.extend({ columns: columnSelection.shape.columns.min(1) })
  );
  validateColumns(full, selected.columns);
  if (!selected.columns.length) throw new Error('APEX global synthesis returned an empty schema');
  const schema: Schema = connectSchema(full, selected.columns);
  runtime.record('linked-schema', schema);
  return { plan, schema, profiles };
}
