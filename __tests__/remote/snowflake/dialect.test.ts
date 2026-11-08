import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { scanStatement, SnowflakeQueryDialect } from '../../../src/query/snowflake';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../../src/util/model', () => ({ languageModel: vi.fn(() => 'test-model') }));

afterEach(() => vi.clearAllMocks());

const compile = vi.fn();
const dialect = new SnowflakeQueryDialect({ model: 'test' }, compile);

beforeEach(() => {
  compile.mockReset().mockResolvedValue(undefined);
});

describe('Snowflake validation', () => {
  it('compiles the statement as a subquery and returns it without trailing terminators', async () => {
    await expect(dialect.validateDSL('SELECT \';\' AS "value" ;\n ; ')).resolves.toBe('SELECT \';\' AS "value"');
    expect(compile).toHaveBeenCalledExactlyOnceWith('SELECT * FROM (SELECT \';\' AS "value"\n)');
  });

  it.each([
    ['SELECT 1 AS "x" -- note', 'SELECT 1 AS "x"'],
    ['SELECT 1 AS "x"; -- note\n/* done */ ;', 'SELECT 1 AS "x"'],
    ['-- leading note\nSELECT 1 AS "x" // trailing', '-- leading note\nSELECT 1 AS "x"'],
  ])('drops trailing comments and terminators: %j', async (sql, expected) => {
    await expect(dialect.validateDSL(sql)).resolves.toBe(expected);
    expect(compile).toHaveBeenCalledExactlyOnceWith(`SELECT * FROM (${expected}\n)`);
  });

  // Snowflake compiles and runs an anonymous procedure even inside a subquery.
  it.each([
    "WITH p AS PROCEDURE () RETURNS VARCHAR LANGUAGE SQL AS $$ BEGIN RETURN 'x'; END $$ CALL p()",
    "with p as /* hidden */ procedure () returns varchar language sql as $$ begin return 'x'; end $$ call p()",
    'WITH "q" AS (SELECT 1 AS "A"), p AS PROCEDURE () RETURNS VARCHAR LANGUAGE SQL AS \'BEGIN RETURN 1; END\' CALL p()',
    'CALL "MY_PROC"()',
  ])('rejects procedures without compiling: %s', async (sql) => {
    await expect(dialect.validateDSL(sql)).rejects.toThrow('procedures are not allowed');
    expect(compile).not.toHaveBeenCalled();
  });

  it('allows the words procedure and call in identifiers, literals and comments', async () => {
    const sql = 'SELECT "PROCEDURE", \'call me\' AS "note", $$PROCEDURE$$ AS "raw" FROM "VISITS" /* CALL */';
    await expect(dialect.validateDSL(sql)).resolves.toBe(sql.replace(' /* CALL */', ''));
    expect(compile).toHaveBeenCalledOnce();
  });

  it('propagates the compilation error, which rejects anything but one query expression', async () => {
    compile.mockRejectedValue(
      new Error("SQL compilation error: syntax error line 1 at position 15 unexpected 'DELETE'.")
    );
    await expect(dialect.validateDSL('DELETE FROM "ORDERS"')).rejects.toThrow("unexpected 'DELETE'");
  });

  it.each(['SELECT SYSTEM$WAIT(10)', 'select system$cancel_all_queries(1)', 'SELECT "SYSTEM$ABORT_SESSION"(1)'])(
    'rejects SYSTEM$ functions without compiling: %s',
    async (sql) => {
      await expect(dialect.validateDSL(sql)).rejects.toThrow('SYSTEM$ functions are not allowed');
      expect(compile).not.toHaveBeenCalled();
    }
  );

  it.each([
    "SELECT 'SYSTEM$WAIT' AS note",
    'SELECT $$SYSTEM$WAIT(1)$$ AS note',
    'SELECT "SYSTEM$WAIT" FROM "SYSTEM$TABLE"',
    'SELECT 1 /* SYSTEM$WAIT(1) */ AS value',
    'SELECT 1 -- SYSTEM$WAIT(1)\n AS value',
    'SELECT "x""SYSTEM$WAIT"(1)',
    "SELECT IDENTIFIER('SYSTEM$COLUMN') FROM IDENTIFIER('SYSTEM$TABLE')",
    "SELECT 'SYSTEM$WAIT', IDENTIFIER('ordinary_column') FROM t",
  ])('allows SYSTEM$ in data, comments and ordinary identifiers: %s', async (sql) => {
    await expect(dialect.validateDSL(sql)).resolves.toBe(sql);
    expect(compile).toHaveBeenCalledOnce();
  });

  it.each([
    'SELECT system$wait /* comment */ (1)',
    'SELECT "SYSTEM$WAIT" /* comment */ (1)',
    'SELECT "PUBLIC"."SYSTEM$WAIT"(1)',
    'SELECT 1 -- note\r, SYSTEM$WAIT(1)',
    'SELECT 1 // note\r, SYSTEM$WAIT(1)',
  ])('rejects function calls across comments and CR line endings: %s', async (sql) => {
    await expect(dialect.validateDSL(sql)).rejects.toThrow('SYSTEM$ functions are not allowed');
    expect(compile).not.toHaveBeenCalled();
  });

  it.each([
    "SELECT IDENTIFIER('SYSTEM$WAIT')(1)",
    "SELECT IDENTIFIER('SYSTEM\\x24WAIT')(1)",
    'SELECT IDENTIFIER($function_name) /* comment */ (1)',
  ])('rejects dynamically resolved function calls before compilation: %s', async (sql) => {
    await expect(dialect.validateDSL(sql)).rejects.toThrow('dynamic function calls');
    expect(compile).not.toHaveBeenCalled();
  });

  it.each(['', '  ', ';', ' ;\n; '])('rejects empty statements: %j', async (sql) => {
    await expect(dialect.validateDSL(sql)).rejects.toThrow('one read-only SELECT statement');
    expect(compile).not.toHaveBeenCalled();
  });
});

describe('Snowflake query generation', () => {
  it.each([
    ['SELECT 1', 'SELECT 1'],
    ['```sql\nSELECT 1\n```', 'SELECT 1'],
    ['SELECT \'```\' AS "value"', 'SELECT \'```\' AS "value"'],
  ])('extracts SQL without corrupting literals: %s', async (text, expected) => {
    vi.mocked(generateText).mockResolvedValue({ text, usage: {}, finishReason: 'stop' } as never);
    await expect(dialect.getDSL('query', { models: [] })).resolves.toMatchObject({ dsl: expected });
  });

  it('asks for case-preserving quoted identifiers and returns the model usage', async () => {
    const usage = { inputTokens: 10, outputTokens: 2, totalTokens: 12 };
    vi.mocked(generateText).mockResolvedValue({ text: 'SELECT 1', usage, finishReason: 'stop' } as never);
    const result = await new SnowflakeQueryDialect({ model: 'test', maxRetries: 0 }, compile).getDSL('count rows', {
      models: [
        {
          name: 'Order Lines',
          columns: [{ name: 'amount', type: 'NUMBER(12,2)' }],
          tableReference: { catalog: 'ANALYTICS', schema: 'SALES', table: 'Order Lines' },
        },
      ],
    });
    const [[request]] = vi.mocked(generateText).mock.calls as unknown as [[{ maxRetries: number; prompt: string }]];
    expect(request.maxRetries).toBe(0);
    expect(request.prompt).toContain('Order Lines');
    expect(request.prompt).toContain('Use Snowflake SQL syntax');
    expect(request.prompt).toContain(dialect.rules);
    expect(dialect.id).toBe('snowflake-sql');
    expect(dialect.rules).not.toContain('Return only SQL text');
    expect(result).toEqual({ dsl: 'SELECT 1', usage });
  });
});

describe('Snowflake generation failures', () => {
  it.each([
    { text: 'SELECT 1', finishReason: 'length', error: 'did not complete' },
    { text: 'SELECT 1', finishReason: 'error', error: 'did not complete' },
    { text: '', finishReason: 'stop', error: 'empty query' },
    { text: '```sql\n\n```', finishReason: 'stop', error: 'empty query' },
  ])('rejects unusable generation: $error', async ({ text, finishReason, error }) => {
    vi.mocked(generateText).mockResolvedValue({ text, finishReason } as never);
    await expect(dialect.getDSL('query', { models: [] })).rejects.toThrow(error);
    expect(compile).not.toHaveBeenCalled();
  });
});

describe('Snowflake statement scanning', () => {
  it.each([
    // A backslash escapes the next character, so this quote does not end the literal.
    ["SELECT 'a\\' PROCEDURE '", ['SELECT']],
    // An escaped backslash does not escape the quote after it, which exposes the keyword.
    ["SELECT 'a\\\\' PROCEDURE", ['SELECT', 'PROCEDURE']],
    ['SELECT \'it\'\'s\' AS "say ""PROCEDURE"""', ['SELECT', 'AS']],
    // Block comments end at the first terminator; a nested reading would hide less code, not more.
    ['SELECT /* a /* b */ PROCEDURE */', ['SELECT', 'PROCEDURE']],
    ['SELECT 1 // PROCEDURE\nFROM t -- CALL', ['SELECT', 'FROM', 'T']],
    ['SELECT $$ PROCEDURE $$, SYSTEM$TYPEOF(1)', ['SELECT', 'SYSTEM$TYPEOF']],
  ])('finds the bare words of %j', (sql, words) => {
    expect(scanStatement(sql).words).toEqual(words);
  });

  it('reports where the code ends', () => {
    const sql = "SELECT ';' AS v ; -- note\n";
    expect(sql.slice(0, scanStatement(sql).end)).toBe("SELECT ';' AS v");
    expect(scanStatement(' ;\n-- only a comment').end).toBe(0);
  });
});
