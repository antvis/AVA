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
import { createOpenAI } from '@ai-sdk/openai';

import { stringifySchema } from '../util/schema';

import type { AnalysisStrategy, QueryLanguage, ExecutionResult } from '../types';

const DEFAULT_MAX_STEPS = 12;

function codeBlocks(response: string, language: string): string[] {
  const escaped = language.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...response.matchAll(new RegExp('```' + escaped + '\\s*([\\s\\S]*?)```', 'gi'))].map((match) =>
    match[1].trim()
  );
}

function loopPrompt(language: QueryLanguage): string {
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
- [CONFIRM] must contain verification and a concise conclusion, but no executable code block.

# 2. EXECUTION DIALECT

The runtime executes ${language.name}. Generate every executable statement directly in this language. The runtime will validate and execute it without translation.

The protocol tag remains [SQL] for compatibility even when the execution dialect is not SQL.

# 3. OBJECTIVE

Produce the smallest correct ${language.name} statement that answers the original question. Use database evidence instead of guessing values, formats, relationships, or field meaning.

Execution success alone is not correctness. Verify that the result has the intended filters, granularity, aggregation, joins, and plausible values.

# 4. LOOP

Use this state flow:

1. If the schema is sufficient, respond with [SQL].
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

Prefer the smallest query that resolves the uncertainty. Use LIMIT for raw sample rows and avoid retrieving large datasets.

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
Conclusion:
<concise answer based on the executed result>

# 6. FINAL SELF-CHECK

Before sending any response, verify all of the following:

1. The response starts immediately with one valid action tag.
2. Exactly one action is selected.
3. The action's code block count is valid.
4. The action follows the current loop state.
5. The response contains no text before the action tag.`;
}

/**
 * Explore, refine, execute, and verify SQL before returning an answer.
 */
export const loopAnalysis: AnalysisStrategy = async (query, config, { schema, engine, llm }) => {
  const openai = createOpenAI({
    apiKey: llm.apiKey,
    baseURL: llm.baseURL,
  });

  const transcript: string[] = [];
  let sql: string | undefined;
  let result: ExecutionResult | undefined;
  let lastConfirmation: string | undefined;
  const maxSteps = config.strategy?.type === 'loop' ? config.strategy.maxSteps ?? DEFAULT_MAX_STEPS : DEFAULT_MAX_STEPS;

  for (let step = 0; step < maxSteps; step += 1) {
    const prompt = `${loopPrompt(engine.language)}

    # DATABASE CONTEXT

    Schema:
    ${stringifySchema(schema)}

    User Question: ${query}

    ${transcript.length ? `\n\n# ITERATION HISTORY\n\n${transcript.join('\n\n')}` : ''}`;

    const response = await generateText({
      model: openai(llm.model) as any,
      maxRetries: llm.maxRetries ?? 3,
      prompt,
    });
    llm.onQueryUsage?.(response.usage);

    const text = response.text.trim();
    const action = text.match(/^\[(EXPLORE|REFINE|SQL|CONFIRM)\]/)?.[1];
    if (!action) throw new Error('Loop response must begin with [EXPLORE], [REFINE], [SQL], or [CONFIRM]');
    transcript.push(`Assistant:\n${text}`);

    if (action === 'REFINE') continue;

    if (action === 'CONFIRM') {
      if (!sql || !result) {
        lastConfirmation = text;
        transcript.push('Runtime:\nNo final SQL has executed successfully yet. Continue the loop.');
        continue;
      }
      return { query, ...result, sql, text: text.replace(/^\[CONFIRM\]\s*/, '') };
    }

    const queries = codeBlocks(text, engine.language.fence);
    if (queries.length === 0 || (action === 'SQL' && queries.length !== 1)) {
      throw new Error(
        `Loop ${action} response must contain ${action === 'SQL' ? 'exactly one' : 'at least one'} ${
          engine.language.fence
        } code block`
      );
    }

    const observations: string[] = [];
    for (const proposal of queries) {
      const statement = proposal;
      try {
        const execution = await engine.execute(statement, config);
        observations.push(
          `Proposed statement (${engine.language.name}):\n${proposal}\nResult:\n${JSON.stringify(execution)}`
        );
        if (action === 'SQL') {
          sql = statement;
          result = execution;
        }
      } catch (error) {
        if (action === 'SQL') result = undefined;
        observations.push(
          `Proposed statement (${engine.language.name}):\n${proposal}\nError:\n${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    transcript.push(`Runtime:\n${observations.join('\n\n')}`);
  }

  // The last normal step may execute the final SQL without leaving another step for CONFIRM.
  // Keep that valid result instead of spending an unnecessary model call.
  if (sql && result) {
    return {
      query,
      ...result,
      sql,
      text: lastConfirmation?.replace(/^\[CONFIRM\]\s*/, '') ?? JSON.stringify(result.data, null, 2),
    };
  }

  // maxSteps limits the normal loop. If it ends without final SQL, allow exactly one
  // history-aware SQL-only turn and adopt its executed result without another CONFIRM.
  const finalResponse = await generateText({
    model: openai(llm.model) as any,
    maxRetries: llm.maxRetries ?? 3,
    prompt: `${loopPrompt(engine.language)}\n\n# DATABASE CONTEXT\n\nSchema:\n${stringifySchema(
      schema
    )}\n\nUser Question: ${query}\n\n# ITERATION HISTORY\n\n${transcript.join(
      '\n\n'
    )}\n\n# FINAL ATTEMPT\n\nThe loop reached its step limit without a final executable statement. Use the complete history above and respond with exactly one [SQL] action containing one ${
      engine.language.name
    } statement.`,
  });
  llm.onQueryUsage?.(finalResponse.usage);

  const proposals = codeBlocks(finalResponse.text.trim(), engine.language.fence);
  if (!finalResponse.text.trim().startsWith('[SQL]') || proposals.length !== 1) {
    throw new Error(`Loop final fallback response must contain exactly one ${engine.language.fence} code block`);
  }

  const proposal = proposals[0];
  const statement = proposal;
  try {
    const execution = await engine.execute(statement, config);
    return {
      query,
      ...execution,
      sql: statement,
      text: lastConfirmation?.replace(/^\[CONFIRM\]\s*/, '') ?? JSON.stringify(execution.data, null, 2),
    };
  } catch (error) {
    throw new Error(
      `Loop final statement failed: ${error instanceof Error ? error.message : String(error)}\nLast attempted ${
        engine.language.name
      } statement:\n${statement}`
    );
  }
};
