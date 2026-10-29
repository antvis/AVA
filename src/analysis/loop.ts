/**
 * Evidence-driven SQL analysis loop:
 *
 * [EXPLORE] queries the database to verify unknown values, formats, and relationships.
 * [REFINE] turns observations or errors into a corrected understanding and query plan.
 * [SQL] produces one candidate answer query, which the runtime translates and executes.
 * [CONFIRM] checks the executed result against the original question before returning it.
 *
 * Every action and runtime observation is fed into the next step; a step limit and one
 * final SQL attempt keep the loop bounded.
 */
import { generateText } from 'ai';
import { z } from 'zod';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';
import { AnalysisEvent, AnalysisEventType } from '../event';
import { serializeError } from '../util/error';

import type {
  AnalysisStrategy,
  QueryLanguage,
  ExecutionResult,
  LoopCheckpoint,
  LoopControl,
  LoopDecision,
} from '../types';

const DEFAULT_MAX_STEPS = 12;

function codeBlocks(response: string, language: string): string[] {
  const escaped = language.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...response.matchAll(new RegExp('```' + escaped + '\\s*([\\s\\S]*?)```', 'gi'))].map((match) =>
    match[1].trim()
  );
}

function loopPrompt(language: QueryLanguage, includeSummary: boolean): string {
  return `You are a data analysis agent. Answer the user's question by querying the provided data source.

# 1. RESPONSE PROTOCOL

Every response is one machine-readable action.

- The first character must be "[".
- Begin with exactly one tag: [EXPLORE], [REFINE], [SQL], or [CONFIRM].
- Do not add a preamble, greeting, explanation, or outer Markdown fence.
- Never return an empty response.
- If you are unsure what to do next, return a valid [REFINE] action.

Action-specific syntax:

- [EXPLORE] must contain at least one fenced ${language.fence} code block. Multiple blocks are allowed.
- [REFINE] must contain reasoning and a next-step plan, but no executable code block.
- [SQL] must contain exactly one fenced ${language.fence} code block and no other code block.
- [CONFIRM] must contain verification${
    includeSummary ? ' and a concise conclusion' : ' only, without a summary or conclusion'
  }, but no executable code block.

# 2. EXECUTION DIALECT

The runtime executes ${
    language.name
  }. Generate every executable statement directly in this language. The runtime will validate and execute it without translation.

The protocol tag remains [SQL] for compatibility even when the execution dialect is not SQL.

${language.instructions ?? ''}

# 3. OBJECTIVE

Produce the smallest correct ${
    language.name
  } statement that answers the original question. Use database evidence instead of guessing values, formats, relationships, or field meaning.

Execution success alone is not correctness. Verify that the result has the intended filters, granularity, aggregation, joins, and plausible values.

# 4. LOOP

Use this state flow:

1. If the dataset profile is sufficient, respond with [SQL].
2. If a required fact is unknown, respond with [EXPLORE].
3. After new evidence or an execution error, respond with [REFINE].
4. After a successful answer query, respond with [CONFIRM] only when its result answers the original question.
5. If verification fails, return to [REFINE] or [EXPLORE].

Stop as soon as the answer is adequately verified.

# 5. ACTIONS

## [EXPLORE]

Use [EXPLORE] only to resolve a concrete uncertainty, such as:

- categorical values or encodings
- date, number, or identifier formats
- representative rows, ranges, nulls, or cardinality
- ambiguous column meaning
- join keys or relationships
- unexpected results from an earlier query

Prefer the smallest query that resolves the uncertainty. Limit raw sample rows using the execution language and avoid retrieving large datasets.

Format:

[EXPLORE]
-- Purpose: <uncertainty being tested>
\`\`\`${language.fence}
<exploration query>
\`\`\`

Additional exploration queries are allowed only when they resolve closely related uncertainties.

## [REFINE]

Use [REFINE] after receiving evidence or an error. State only findings that change the query and the next plan.

Format:

[REFINE]
Findings:
- <relevant evidence>
Plan:
- <corrected query approach>
Next: [EXPLORE] or [SQL]

## [SQL]

Use [SQL] when the question and relevant database semantics are sufficiently understood.

Before writing the statement, verify that:

- every referenced table and column exists
- filters use verified values and correct null semantics
- joins use valid keys without unintended duplication
- date ranges and aggregation granularity match the question
- the query returns the requested answer shape

Format:

[SQL]
\`\`\`${language.fence}
<one answer query>
\`\`\`

Do not include prose outside the single code block.

## [CONFIRM]

Use [CONFIRM] only after a successful answer query has executed. Compare the SQL and result with the original question.

Check for empty results, unexpected row counts, nulls, duplicates, implausible values, missing categories, and incorrect granularity. If any important doubt remains, use [REFINE] or [EXPLORE] instead.

Format:

[CONFIRM]
Verification:
- <what was checked>
${includeSummary ? 'Conclusion:\n<concise answer based on the executed result>' : ''}

# 6. FINAL SELF-CHECK

Before sending any response, verify all of the following:

1. The response starts immediately with one valid action tag.
2. Exactly one action is selected.
3. The action's code block count is valid.
4. The action follows the current loop state.
5. The response contains no text before the action tag.`;
}

const transcriptPrompt = (transcript: string[]) => {
  if (transcript.length === 0) return '';

  return `
    # ITERATION HISTORY

    ${transcript.join('\n\n')}
  `;
};

const checkpointSchema = z.object({
  version: z.literal(2),
  id: z.string().min(1),
  parentIds: z.array(z.string().min(1)),
  query: z.string(),
  dataset: z.string(),
  language: z.string(),
  maxSteps: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  step: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  phase: z.enum(['model', 'query', 'complete']),
  transcript: z.array(z.string()),
  pending: z
    .object({
      action: z.enum(['EXPLORE', 'SQL']),
      queries: z.array(z.string()).min(1),
      index: z.number().int().min(0),
      observations: z.array(z.string()),
      finalAttempt: z.boolean(),
    })
    .optional(),
  sql: z.string().optional(),
  result: z
    .object({
      schema: z.array(z.object({ name: z.string(), type: z.string().optional() })),
      data: z.array(z.record(z.unknown())),
      truncated: z.literal(true).optional(),
      truncatedBy: z.enum(['maxRows', 'maxResultBytes']).optional(),
      rowCount: z.number().optional(),
    })
    .optional(),
  lastConfirmation: z.string().optional(),
  completion: z.object({ reason: z.enum(['confirmed', 'step_limit', 'final_attempt']), text: z.string() }).optional(),
});

const copyCheckpoint = (state: LoopCheckpoint): LoopCheckpoint => JSON.parse(JSON.stringify(state));

function restoreCheckpoint(initial: LoopCheckpoint, resume?: LoopCheckpoint): LoopCheckpoint {
  if (!resume) return initial;
  const state = checkpointSchema.parse(resume) as LoopCheckpoint;
  for (const key of ['query', 'dataset', 'language', 'maxSteps'] as const) {
    if (state[key] !== initial[key]) throw new Error(`Loop checkpoint ${key} does not match this analysis`);
  }
  if (
    state.step > state.maxSteps ||
    (state.phase === 'query' && (!state.pending || state.pending.index >= state.pending.queries.length)) ||
    (state.phase === 'complete' && (!state.completion || !state.result || !state.sql))
  ) {
    throw new Error('Invalid loop checkpoint state');
  }
  const expectedId =
    state.phase === 'model'
      ? `m-${state.step}`
      : state.phase === 'query'
      ? `q-${state.step}-${state.pending!.index}`
      : 'conclusion';
  if (state.id !== expectedId || state.parentIds.includes(state.id))
    throw new Error('Invalid loop checkpoint identity');
  return copyCheckpoint(state);
}

async function abortable<T>(work: () => Promise<T> | T, signal?: AbortSignal): Promise<T> {
  signal?.throwIfAborted();
  let onAbort: (() => void) | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => {
        signal?.throwIfAborted();
        return work();
      }),
      new Promise<never>((_, reject) => {
        if (signal) {
          onAbort = () => reject(signal.reason ?? new Error('Analysis cancelled'));
          signal.addEventListener('abort', onAbort, { once: true });
        }
      }),
    ]);
  } finally {
    if (onAbort) signal?.removeEventListener('abort', onAbort);
  }
}

async function controlBoundary(state: LoopCheckpoint, control?: LoopControl): Promise<void> {
  if (!control) return;
  await abortable(() => control.onCheckpoint?.(copyCheckpoint(state)), control.signal);
  if (state.phase === 'complete') return;
  const value = await abortable(() => control.beforeStep?.(copyCheckpoint(state)), control.signal);
  if (!value) return;
  const decision: LoopDecision = z
    .object({
      sql: z.string().trim().min(1).max(64000).optional(),
      instruction: z.string().trim().min(1).max(8000).optional(),
    })
    .strict()
    .parse(value);
  if (!decision.sql && !decision.instruction) return;
  if (decision.sql !== undefined) {
    if (state.phase !== 'query' || !state.pending) throw new Error('SQL can only be edited before a query');
    const original = state.pending.queries[state.pending.index];
    state.pending.queries[state.pending.index] = decision.sql;
    state.transcript.push(
      `User intervention: replaced pending query.\nOriginal:\n${original}\nActual query:\n${decision.sql}`
    );
  }
  if (decision.instruction) {
    state.transcript.push(`User guidance:\n${decision.instruction}`);
    // New constraints must be checked again before accepting an earlier answer.
    state.sql = undefined;
    state.result = undefined;
    state.lastConfirmation = undefined;
  }
  await abortable(() => control.onCheckpoint?.(copyCheckpoint(state)), control.signal);
}

/**
 * Explore, refine, execute, and verify SQL before returning an answer.
 */
export const loopAnalysis: AnalysisStrategy = async (query, config, { dataModel, engine, llm, emit }) => {
  const dataset = stringifyDataModel(dataModel);
  const strategy = config.strategy?.type === 'loop' ? config.strategy : undefined;
  const control = strategy?.control;
  const maxSteps = strategy?.maxSteps ?? DEFAULT_MAX_STEPS;
  if (!Number.isSafeInteger(maxSteps) || maxSteps < 0) throw new Error('maxSteps must be a non-negative safe integer');
  const state = restoreCheckpoint(
    {
      version: 2,
      id: 'm-0',
      parentIds: [],
      query,
      dataset,
      language: engine.language.name,
      maxSteps,
      step: 0,
      phase: 'model',
      transcript: [],
    },
    control?.resumeFrom
  );

  const finishRound = () => {
    state.parentIds = state.pending
      ? [`m-${state.step}`, ...state.pending.queries.map((_, index) => `q-${state.step}-${index}`)]
      : [state.id];
    state.pending = undefined;
    state.step += 1;
    state.id = `m-${state.step}`;
    state.phase = 'model';
    if (state.step >= maxSteps && state.sql && state.result) {
      state.id = 'conclusion';
      state.phase = 'complete';
      state.completion = {
        reason: 'step_limit',
        text: state.lastConfirmation?.replace(/^\[CONFIRM\]\s*/, '') ?? JSON.stringify(state.result.data, null, 2),
      };
    }
  };

  while (true) {
    await controlBoundary(state, control);
    control?.signal?.throwIfAborted();
    const operation = { id: state.id, parentIds: state.parentIds };

    if (state.phase === 'complete') {
      return {
        query,
        ...state.result!,
        sql: state.sql,
        text: config.includeSummary === false ? '' : state.completion!.text,
        ...operation,
        completionReason: state.completion!.reason,
      };
    }

    const step = state.step;
    if (state.phase === 'model') {
      const finalAttempt = step >= maxSteps;
      const metadata = { step, ...(finalAttempt ? { finalAttempt: true } : {}) };
      const prompt = `${loopPrompt(engine.language, config.includeSummary !== false)}

    # DATABASE CONTEXT
    ${dataset}

    User Question: ${query}
    ${transcriptPrompt(state.transcript)}
    ${
      finalAttempt
        ? `# FINAL ATTEMPT
    The loop reached its step limit without a final executable statement. Use the complete history above and respond with exactly one [SQL] action containing one ${engine.language.name} statement.`
        : ''
    }`;

      emit(
        new AnalysisEvent(
          AnalysisEventType.REASON_START,
          { ...metadata, ...(config.telemetry ? { prompt } : {}) },
          operation
        )
      );
      let text: string;
      let action: string;
      let queries: string[] = [];
      try {
        const response = await generateText({
          model: languageModel(llm),
          maxRetries: llm.maxRetries ?? 3,
          prompt,
          ...(control?.signal ? { abortSignal: control.signal } : {}),
        });
        control?.signal?.throwIfAborted();
        llm.onQueryUsage?.(response.usage);
        text = response.text.trim();
        action = text.match(/^\[(EXPLORE|REFINE|SQL|CONFIRM)\]/)?.[1];
        if (!action) throw new Error('Loop response must begin with [EXPLORE], [REFINE], [SQL], or [CONFIRM]');
        if (finalAttempt && action !== 'SQL') throw new Error('Loop final fallback must contain one SQL action');
        if (action === 'EXPLORE' || action === 'SQL') {
          queries = codeBlocks(text, engine.language.fence);
          if (!queries.length || (action === 'SQL' && queries.length !== 1)) {
            throw new Error(
              `Loop ${action} response must contain ${action === 'SQL' ? 'exactly one' : 'at least one'} ${
                engine.language.fence
              } code block`
            );
          }
        }
      } catch (error) {
        emit(new AnalysisEvent(AnalysisEventType.REASON_END, { ...metadata, error: serializeError(error) }, operation));
        throw error;
      }
      emit(new AnalysisEvent(AnalysisEventType.REASON_END, { ...metadata, action, text }, operation));
      state.transcript.push(`Assistant:\n${text}`);
      if (action === 'REFINE') {
        finishRound();
      } else if (action === 'CONFIRM') {
        if (state.sql && state.result) {
          state.parentIds = [state.id];
          state.id = 'conclusion';
          state.phase = 'complete';
          state.completion = { reason: 'confirmed', text: text.replace(/^\[CONFIRM\]\s*/, '') };
        } else {
          state.lastConfirmation = text;
          state.transcript.push('Runtime:\nNo final SQL has executed successfully yet. Continue the loop.');
          finishRound();
        }
      } else {
        state.parentIds = [state.id];
        state.id = `q-${step}-0`;
        state.phase = 'query';
        state.pending = {
          action: action as 'EXPLORE' | 'SQL',
          queries,
          index: 0,
          observations: [],
          finalAttempt,
        };
      }
      continue;
    }

    const pending = state.pending!;
    const statement = pending.queries[pending.index];
    const metadata =
      control || config.telemetry
        ? { step, queryIndex: pending.index, action: pending.action, finalAttempt: pending.finalAttempt }
        : {};
    emit(new AnalysisEvent(AnalysisEventType.QUERY_START, { dsl: statement, ...metadata }, operation));
    let execution: ExecutionResult | undefined;
    try {
      execution = await engine.execute(statement, config);
      control?.signal?.throwIfAborted();
    } catch (error) {
      emit(new AnalysisEvent(AnalysisEventType.QUERY_END, { error: serializeError(error), ...metadata }, operation));
      control?.signal?.throwIfAborted();
      if (pending.action === 'SQL') state.result = undefined;
      pending.observations.push(
        `Actual statement (${engine.language.name}):\n${statement}\nError:\n${
          error instanceof Error ? error.message : String(error)
        }`
      );
      if (pending.finalAttempt) {
        throw new Error(
          `Loop final statement failed: ${error instanceof Error ? error.message : String(error)}\nLast attempted ${
            engine.language.name
          } statement:\n${statement}`
        );
      }
    }
    if (execution) {
      emit(new AnalysisEvent(AnalysisEventType.QUERY_END, { ...execution, ...metadata }, operation));
      pending.observations.push(
        `Actual statement (${engine.language.name}):\n${statement}\nResult:\n${JSON.stringify(execution)}`
      );
      if (pending.action === 'SQL') {
        state.sql = statement;
        state.result = execution;
      }
    }
    pending.index += 1;
    if (pending.index < pending.queries.length) {
      state.id = `q-${step}-${pending.index}`;
      continue;
    }
    state.transcript.push(`Runtime:\n${pending.observations.join('\n\n')}`);
    if (pending.finalAttempt) {
      state.parentIds = [state.id];
      state.id = 'conclusion';
      state.phase = 'complete';
      state.completion = {
        reason: 'final_attempt',
        text: state.lastConfirmation?.replace(/^\[CONFIRM\]\s*/, '') ?? JSON.stringify(state.result!.data, null, 2),
      };
      state.pending = undefined;
    } else {
      finishRound();
    }
  }
};
