/**
 * Semantic-layer agent (Think–Act loop):
 *
 * Every step the model returns exactly one tool call:
 *  - getModelDataElements: discover semantic models, dimensions, measures, metrics and join edges.
 *  - convertSmqToSql: deterministically compile an SMQ into trusted SQL and preview 5 rows.
 *  - execute: validate composed SQL, then execute once and terminate.
 *  - cannotAnswer: terminate with an explicit reason when the available semantics are insufficient.
 *
 * The agent never sees the raw physical schema; only physical tables and columns introduced by successful SMQs may be
 * used by the final SQL.
 */
import { ToolLoopAgent, isStepCount } from 'ai';
import { z } from 'zod';

import { languageModel } from '../util/model';
import { AnalysisEvent, AnalysisEventType } from '../event';
import { serializeError } from '../util/error';
import { compileSMQ, inferDialect } from '../semantic/compiler';
import { smqSchema } from '../semantic/schema';

import { summarizeResult } from './direct';

import type { FlexibleSchema } from 'ai';
import type { AnalysisStrategy, ExecutionResult } from '../types';
import type { SMQ } from '../semantic/types';

const DEFAULT_MAX_STEPS = 20;
const PREVIEW_ROWS = 5;

function systemPrompt(dialectName: string, instructions?: string): string {
  return `Answer the question using semantic models and verified SQL building blocks in ${dialectName}.

Call exactly one tool per step. Reason privately before choosing the next action.

Workflow:
1. Discover the relevant semantic elements before compiling.
2. Compile SMQs to explore physical expressions, join predicates, dialect syntax and values.
   Compilation is grounding evidence, not a substitute for composing the final answer.
   Determine entity grain, aggregation and ordering from the question and semantic descriptions.
3. Compose the final SQL from successful compiler outputs. Add CTEs, subqueries, window functions
   or recursive logic when needed. Distinguish physical column names from compiled output aliases.
   Reuse applicable compiled expressions and subqueries; preserve their semantics when composing.
4. Use only physical tables and columns introduced by successful compilations. Never treat a
   semantic model name as a physical table unless that physical name was returned by the compiler.
   Do not inspect database catalogs or INFORMATION_SCHEMA. Explore again when evidence is missing.
5. Compute the answer in SQL; previews are incomplete and must not be copied as the answer.
   Preserve the requested grain, duplicates and NULL semantics. Follow the question's output format.
6. If required fields, relationships or business definitions cannot be established after discovery,
   call cannotAnswer with the missing information. Do not invent a substitute or force an answer.

Choose the result grain before writing the SMQ and preserve it in the final SQL:
- Ranking recorded values or returning attributes of the highest/lowest N records preserves repeated
  values. Sort the records, take N, then project the requested attributes. A repeated output value
  does not make two records the same. Do not introduce DISTINCT or GROUP BY just because this is a list.
- Ranking categories by frequency, or entities by a total/average, requires the corresponding
  grouping and aggregate before ranking. Ranking N distinct values requires explicit deduplication.
- "Unique attributes of the top N records" means select the N records in a subquery first, then
  deduplicate the projected attributes; deduplicating before LIMIT answers a different question.
- For record-grain SMQs, put the selected dimensions/measures in metrics and leave group_by empty.
  A compiler preview with distinct grain is not a record-grain building block.

${instructions ?? ''}`;
}

/** Answer a question through the semantic layer using a constrained Think–Act loop. */
export const semanticAnalysis: AnalysisStrategy = async (query, config, { context, engine, llm, emit, semantic }) => {
  if (!semantic) throw new Error('The semantic strategy requires a semantic layer. Call semantic() first.');
  if (!engine.validateSemanticQuery) throw new Error('This engine does not support semantic SQL validation.');

  semantic.validateAgainstSchema(context.schema);

  const dialect = semantic.dialect ?? inferDialect(engine.language.name);
  const options = config.strategy?.type === 'semantic' ? config.strategy : undefined;
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_STEPS;
  if (!Number.isSafeInteger(maxSteps) || maxSteps < 1) throw new Error('semantic.maxSteps must be a positive integer');
  const evidence: string[] = [];
  const discovered = new Set<string>();
  let step = 0;
  let reasonEnded = false;
  let actionError: Error | undefined;
  let finalAttempted = false;
  let finalError: Error | undefined;
  let insufficientInformation: Error | undefined;
  let finalResult: { sql: string; result: ExecutionResult } | undefined;

  // The SDK can receive parallel calls even when the prompt requests one action.
  const checkAction = () => {
    if (actionError) throw actionError;
    if (finalAttempted || insufficientInformation) throw new Error('The analysis has finished.');
  };

  // Explicit schema types avoid deep Zod 3 inference with this project's non-strict TypeScript settings.
  const semanticTools = {
    getModelDataElements: {
      description:
        'Discover business descriptions, dimensions, row-level measures, predefined metrics and model relationships. ' +
        'Omit models to discover all. Dimensions/measures use Model__element. Unique metrics use their bare name; ' +
        'qualified metrics are also accepted.',
      inputSchema: z.object({ models: z.array(z.string()).optional() }).strict() as unknown as FlexibleSchema<{
        models?: string[];
      }>,
      execute: async ({ models }: { models?: string[] }) => {
        checkAction();
        const elements = semantic.elements(models);
        const names = new Set(models?.length ? models : semantic.models.keys());
        for (const name of names) discovered.add(name);
        const joins = semantic.joins
          .filter((j) => names.has(j.from) || names.has(j.to))
          .map(({ from, to, type }) => ({ from, to, type: type ?? 'left' }));
        return {
          models: [...names].map((name) => ({ name, description: semantic.models.get(name)?.description })),
          elements,
          joins,
        };
      },
    },
    convertSmqToSql: {
      description:
        'Compile an SMQ and return SQL, output aliases and up to five preview rows. ' +
        'metrics targets may be dimensions, measures or predefined metrics. Row targets are not implicitly summed; ' +
        'use predefined metrics for aggregation. group_by groups row expressions when aggregates are present; ' +
        'otherwise it returns distinct combinations. Without group_by, row targets preserve duplicates. ' +
        'Row filters become WHERE; aggregate metric filters become HAVING. Filters support comparisons, IN, LIKE, ' +
        "BETWEEN, IS NULL, AND, OR and NOT, e.g. Model__status = 'paid'. " +
        'order_by fields must be selected targets. Discover all involved models before compiling.',
      inputSchema: smqSchema as unknown as FlexibleSchema<SMQ>,
      execute: async (smq: SMQ) => {
        checkAction();
        const compiled = compileSMQ(semantic, smq, dialect);
        if (compiled.models.some((model) => !discovered.has(model))) {
          throw new Error(
            `Discover these models before compilation: ${compiled.models
              .filter((model) => !discovered.has(model))
              .join(', ')}`
          );
        }
        emit(new AnalysisEvent(AnalysisEventType.QUERY_START, { dsl: compiled.sql }));
        try {
          const preview = await engine.execute(compiled.sql, { ...config, maxRows: PREVIEW_ROWS });
          emit(new AnalysisEvent(AnalysisEventType.QUERY_END, preview));
          evidence.push(compiled.sql);
          return {
            fragmentId: `smq_${evidence.length}`,
            sql: compiled.sql,
            columns: compiled.columns,
            grain: compiled.grain,
            preview: preview.data,
            returnedRows: preview.data.length,
            truncated: !!(preview.truncated || preview.truncatedBy),
            truncatedBy: preview.truncatedBy,
          };
        } catch (error) {
          emit(new AnalysisEvent(AnalysisEventType.QUERY_END, { error: serializeError(error) }));
          throw new Error(
            `Compiled SQL failed to execute:\n${compiled.sql}\n${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      },
    },
    cannotAnswer: {
      description:
        'After discovering semantic elements, end without a query when required information is missing or ambiguous. ' +
        'Explain what is missing; never use this for an ordinary empty query result or an execution error.',
      inputSchema: z.object({ reason: z.string().trim().min(1) }).strict() as unknown as FlexibleSchema<{
        reason: string;
      }>,
      execute: async ({ reason }: { reason: string }) => {
        checkAction();
        if (!discovered.size) throw new Error('Discover semantic models before reporting insufficient information.');
        insufficientInformation = new Error(reason);
        insufficientInformation.name = 'InsufficientInformationError';
        return { answered: false, reason };
      },
    },
    execute: {
      description:
        'Validate final read-only SQL against successful compiler outputs, then execute once and terminate. ' +
        'Validation errors allow correction; execution errors terminate. Result limits do not change the query.',
      inputSchema: z.object({ sql: z.string().trim().min(1) }).strict() as unknown as FlexibleSchema<{ sql: string }>,
      execute: async ({ sql }: { sql: string }) => {
        checkAction();
        if (evidence.length === 0) {
          throw new Error('Call convertSmqToSql successfully at least once before execute.');
        }
        await engine.validateSemanticQuery!(sql, evidence, context.schema);
        finalAttempted = true;
        emit(new AnalysisEvent(AnalysisEventType.QUERY_START, { dsl: sql }));
        try {
          const result = await engine.execute(sql, config);
          emit(new AnalysisEvent(AnalysisEventType.QUERY_END, result));
          finalError = undefined;
          finalResult = { sql, result };
          return { executed: true };
        } catch (error) {
          emit(new AnalysisEvent(AnalysisEventType.QUERY_END, { error: serializeError(error) }));
          finalError = new Error(
            `Semantic final SQL failed: ${error instanceof Error ? error.message : String(error)}\nSQL:\n${sql}`
          );
          throw finalError;
        }
      },
    },
  };

  const agent = new ToolLoopAgent({
    model: languageModel(llm),
    instructions: systemPrompt(dialect, engine.language.instructions),
    maxRetries: llm.maxRetries ?? 3,
    temperature: llm.temperature,
    maxOutputTokens: llm.maxOutputTokens,
    providerOptions: llm.providerOptions,
    toolChoice: 'required',
    stopWhen: [isStepCount(maxSteps), () => finalAttempted || !!insufficientInformation],
    prepareStep: ({ stepNumber }) => {
      step = stepNumber;
      reasonEnded = false;
      actionError = undefined;
      return stepNumber === maxSteps - 1 ? { activeTools: ['execute', 'cannotAnswer'] } : undefined;
    },
    onStepStart: () => {
      emit(new AnalysisEvent(AnalysisEventType.REASON_START, { step }));
    },
    onLanguageModelCallEnd: ({ content, usage }) => {
      llm.onQueryUsage?.(usage);
      const calls = content.filter((part) => part.type === 'tool-call');
      if (calls.length !== 1) actionError = new Error('Call exactly one tool per step.');
      const call = calls.length === 1 ? calls[0] : undefined;
      reasonEnded = true;
      emit(
        new AnalysisEvent(AnalysisEventType.REASON_END, {
          step,
          ...(call ? { action: call.toolName, text: JSON.stringify({ tool: call.toolName, args: call.input }) } : {}),
          ...(actionError ? { error: serializeError(actionError) } : {}),
        })
      );
    },
    tools: semanticTools,
  });

  try {
    await agent.generate({ prompt: query });
  } catch (error) {
    if (!reasonEnded) emit(new AnalysisEvent(AnalysisEventType.REASON_END, { step, error: serializeError(error) }));
    throw error;
  }
  if (insufficientInformation) throw insufficientInformation;
  if (finalError) throw finalError;
  if (!finalResult) {
    throw new Error(
      step === maxSteps - 1
        ? `Semantic strategy reached the step limit (${maxSteps}) without executing a final SQL`
        : 'Semantic strategy ended without executing a final SQL. The model must call tools.'
    );
  }

  const { sql, result } = finalResult;
  let summary = '';
  if (config.includeSummary !== false) {
    emit(new AnalysisEvent(AnalysisEventType.SUMMARIZE_START));
    try {
      summary = await summarizeResult(
        query,
        result.truncatedBy ? { data: result.data, truncated: true, truncatedBy: result.truncatedBy } : result.data,
        llm
      );
    } catch (error) {
      emit(new AnalysisEvent(AnalysisEventType.SUMMARIZE_END, { error: serializeError(error) }));
      throw error;
    }
    emit(new AnalysisEvent(AnalysisEventType.SUMMARIZE_END, { text: summary }));
  }
  return { query, ...result, sql, text: summary };
};
