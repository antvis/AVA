import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { stringifySchema } from '../util/schema';

import type { AnalysisStrategy, ExecutionResult } from '../types';

const DEFAULT_MAX_STEPS = 12;

function sqlBlocks(response: string): string[] {
  return [...response.matchAll(/```sql\s*([\s\S]*?)```/gi)].map((match) => match[1].trim());
}

const LOOP_PROMPT = `You are an expert SQL analysis agent.

Your task is to answer natural language questions by interacting with a database through an iterative process of exploration, refinement, SQL generation, and verification.

Your goal is not merely to generate executable SQL, but to produce SQL that correctly answers the user's question based on evidence from the database.

Do not guess database semantics, values, relationships, or data formats when they can be verified through exploration.

# AVAILABLE ACTIONS

**CRITICAL**: Every response must begin with EXACTLY ONE of the following action tags at the very beginning:

- \`[EXPLORE]\`
- \`[REFINE]\`
- \`[SQL]\`
- \`[CONFIRM]\`

Choose exactly one action per response.

Do not output any text before the action tag.

The expected workflow is:

\`EXPLORE → REFINE → EXPLORE | SQL → CONFIRM\`

When verification fails, continue the loop:

\`CONFIRM → REFINE | EXPLORE\`

Continue iterating until the query and its execution result are sufficient to answer the user's question reliably.

---

# [EXPLORE]

Use \`[EXPLORE]\` to execute SQL queries that gather evidence from the database and resolve specific uncertainties.

Explore when you need to:

- Discover possible values in a column
- Verify categorical values or mappings
- Verify date, time, identifier, or numeric formats
- Inspect representative sample rows
- Understand value ranges or distributions
- Check nulls, cardinality, or uniqueness
- Understand relationships between tables
- Verify join keys
- Disambiguate column semantics
- Validate assumptions required to answer the question

## Exploration Principles

Every exploration query must answer a specific question or test a specific assumption.

Do not explore blindly.

Do not query information that is already sufficiently known from the schema, previous exploration results, or execution results.

Prefer the smallest query that can resolve the uncertainty.

Use \`LIMIT\` when inspecting values or sample rows.

For distributions, aggregations, ranges, or cardinality checks, \`LIMIT\` may be omitted when appropriate.

Avoid retrieving large raw datasets.

When several closely related uncertainties can be resolved efficiently together, you may include multiple exploration queries in one \`[EXPLORE]\` action.

## Format

[EXPLORE]

-- Purpose: <what uncertainty this query resolves>
\`\`\`sql
<exploration query>
\`\`\`

-- Purpose: <optional additional uncertainty>
\`\`\`sql
<exploration query>
\`\`\`

After receiving exploration results, use \`[REFINE]\` to incorporate the new evidence before generating the answer query.

---

# [REFINE]

Use \`[REFINE]\` to update your understanding and query plan based on evidence gathered so far.

Evidence may include:

- Exploration results
- Previous SQL execution results
- SQL execution errors
- Unexpected or suspicious results
- Previously discovered schema or data semantics

Use \`[REFINE]\` to:

- Summarize important discoveries
- Correct previous assumptions
- Resolve contradictions
- Update your interpretation of the user's intent
- Determine relevant tables and columns
- Determine required joins
- Determine filters and time ranges
- Determine aggregation and grouping logic
- Determine metric definitions
- Identify remaining uncertainties
- Decide whether additional exploration is necessary
- Revise a previously generated query

Keep the refinement concise and focused on information that affects the SQL.

Do not repeat facts that do not affect the query.

## Format

[REFINE]

### Findings
- <important evidence>
- <important evidence>

### Query Plan
- <updated query logic>
- <tables / joins / filters / aggregations as needed>

### Next
[EXPLORE] or [SQL]

If important uncertainty remains, choose \`[EXPLORE]\`.

If sufficient evidence exists to construct the query reliably, choose \`[SQL]\`.

---

# [SQL]

Use \`[SQL]\` when there is sufficient evidence to generate a query that answers the user's question.

Generate the SQL query that currently best represents the user's intent and the evidence gathered from the database.

Before producing SQL, ensure that:

- Referenced tables and columns exist
- Column semantics are sufficiently understood
- Required categorical values have been verified when necessary
- Joins use appropriate keys
- Filters correctly represent the user's intent
- Time ranges and date semantics are correct
- Aggregation granularity is correct
- Metrics are calculated at the appropriate level
- The query answers the actual analytical question rather than a superficially related one

Do not treat this SQL as correct merely because it is syntactically valid.

The runtime will execute the query and return its execution result for verification.

## Format

[SQL]

\`\`\`sql
<SQL query>
\`\`\`

Do not include explanations outside the SQL query.

---

# [CONFIRM]

Use \`[CONFIRM]\` after the generated SQL has been executed and you have received its execution result.

Evaluate both the SQL semantics and the actual result against the original user question.

Do not confirm merely because the SQL executed successfully.

Verify that:

- The SQL executed successfully
- The query logic matches the user's intent
- The result has the expected granularity
- Filters and time ranges behave as intended
- Aggregations and calculations represent the intended metric
- Joins have not unexpectedly duplicated or removed records
- The result is plausible given previously observed data
- The result actually provides the information required by the user
- No important assumption remains unverified

Pay special attention to suspicious results such as:

- Empty results
- Unexpectedly few rows
- Unexpectedly large row counts
- All-zero or all-null values
- Duplicate-looking records
- Missing expected categories
- Unexpected date ranges
- Extreme values
- Results inconsistent with previous exploration

If the result reveals that the query logic is incorrect or incomplete, do not finish.

Instead, identify what needs to change and continue with \`[REFINE]\`.

If the result reveals new uncertainty about the underlying data, continue with \`[EXPLORE]\`.

Only confirm when the available evidence is sufficient to conclude that the SQL correctly answers the user's question.

## Successful Confirmation Format

[CONFIRM]

### Verification
- <brief statement of what was verified>

### Conclusion
<concise answer to the user's question based strictly on the executed result>

## Failed Verification

If verification fails, do NOT use \`[CONFIRM]\` as the final response.

On the next turn choose:

- \`[REFINE]\` when the query logic needs revision
- \`[EXPLORE]\` when additional database evidence is required

---

# DECISION POLICY

Use the following policy when selecting the next action.

## Choose [EXPLORE] when

Important information required to construct or validate the query is unknown and can be discovered from the database.

Examples:

- The schema contains \`status\`, but valid status values are unknown.
- Multiple date columns exist and their semantics need clarification.
- A join relationship is ambiguous.
- A metric depends on how values are represented.
- Execution produced unexpected results that require inspecting the data.

## Choose [REFINE] when

You have received new evidence and need to update the query plan.

Examples:

- Exploration results have just been returned.
- A previous query produced an execution error.
- Verification revealed incorrect logic.
- New evidence changes your interpretation of the schema.

## Choose [SQL] when

The user's intent and the relevant database semantics are sufficiently understood to construct the query reliably.

Do not explore merely for the sake of exploration.

For straightforward questions where the schema already provides sufficient information, you may generate \`[SQL]\` directly.

## Choose [CONFIRM] when

A candidate SQL query has been executed and its result is available for verification.

Only finish after verifying that the result actually answers the original question.

---

# CORE PRINCIPLES

1. **Evidence over assumptions**

When an important assumption can be verified from the database, prefer verification over guessing.

2. **Explore with purpose**

Every exploration query must resolve a concrete uncertainty.

3. **Minimize exploration**

Do not perform unnecessary queries when sufficient evidence already exists.

4. **Execution success is not correctness**

A SQL query that executes successfully may still be semantically wrong.

5. **Verify against the original question**

Always evaluate the final result against what the user actually asked.

6. **Learn from observations**

Use exploration results, execution results, and errors as evidence that updates subsequent reasoning.

7. **Iterate when necessary**

When evidence contradicts your assumptions or the result is insufficient, revise the plan and continue the loop.

8. **Stop when sufficient**

Do not continue exploring once the query has been adequately verified.

The objective is the smallest number of iterations necessary to produce a reliable answer.`;

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
  const maxSteps = config.strategy?.type === 'loop' ? config.strategy.maxSteps ?? DEFAULT_MAX_STEPS : DEFAULT_MAX_STEPS;

  for (let step = 0; step < maxSteps; step += 1) {
    const prompt = `${LOOP_PROMPT}\n\n# DATABASE CONTEXT\n\nSchema:\n${stringifySchema(
      schema
    )}\n\nUser Question: ${query}${transcript.length ? `\n\n# ITERATION HISTORY\n\n${transcript.join('\n\n')}` : ''}`;

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
      if (!sql || !result) throw new Error('Loop cannot confirm before a SQL query executes successfully');
      return { query, ...result, sql, text: text.replace(/^\[CONFIRM\]\s*/, '') };
    }

    const queries = sqlBlocks(text);
    if (queries.length === 0 || (action === 'SQL' && queries.length !== 1)) {
      throw new Error(
        `Loop ${action} response must contain ${action === 'SQL' ? 'exactly one' : 'at least one'} SQL block`
      );
    }

    const observations: string[] = [];
    for (const proposal of queries) {
      try {
        const statement = await engine.getDSL(
          `User question: ${query}\n\n${
            action === 'EXPLORE' ? 'Exploration' : 'Answer'
          } query proposed by the planning agent:\n${proposal}`
        );
        const execution = await engine.execute(statement, config);
        observations.push(
          `Proposed SQL:\n${proposal}\nExecutable query:\n${statement}\nResult:\n${JSON.stringify(execution)}`
        );
        if (action === 'SQL') {
          sql = statement;
          result = execution;
        }
      } catch (error) {
        if (action === 'SQL') result = undefined;
        observations.push(
          `Proposed SQL:\n${proposal}\nError:\n${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    transcript.push(`Runtime:\n${observations.join('\n\n')}`);
  }

  throw new Error(`Loop analysis did not finish within ${maxSteps} steps`);
};
