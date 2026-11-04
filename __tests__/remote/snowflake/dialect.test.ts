import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { scanStatement, SnowflakeQueryDialect } from '../../../src/query/snowflake';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../../src/util/model', () => ({ languageModel: vi.fn(() => 'test-model') }));

afterEach(() => vi.clearAllMocks());

const dialect = new SnowflakeQueryDialect({ model: 'test' });

describe('Snowflake validation', () => {
  it('compiles the statement as a subquery and returns it without trailing terminators', async () => {
    const compile = vi.fn().mockResolvedValue(undefined);
    await expect(dialect.validateDSL('SELECT \';\' AS "value" ;\n ; ', compile)).resolves.toBe(
      'SELECT \';\' AS "value"'
    );
    expect(compile).toHaveBeenCalledExactlyOnceWith('SELECT * FROM (SELECT \';\' AS "value"\n)');
  });

  it.each([
    ['SELECT 1 AS "x" -- note', 'SELECT 1 AS "x"'],
    ['SELECT 1 AS "x"; -- note\n/* done */ ;', 'SELECT 1 AS "x"'],
    ['-- leading note\nSELECT 1 AS "x" // trailing', '-- leading note\nSELECT 1 AS "x"'],
  ])('drops trailing comments and terminators: %j', async (sql, expected) => {
    const compile = vi.fn().mockResolvedValue(undefined);
    await expect(dialect.validateDSL(sql, compile)).resolves.toBe(expected);
    expect(compile).toHaveBeenCalledExactlyOnceWith(`SELECT * FROM (${expected}\n)`);
  });

  // Snowflake compiles and runs an anonymous procedure even inside a subquery.
  it.each([
    "WITH p AS PROCEDURE () RETURNS VARCHAR LANGUAGE SQL AS $$ BEGIN RETURN 'x'; END $$ CALL p()",
    "with p as /* hidden */ procedure () returns varchar language sql as $$ begin return 'x'; end $$ call p()",
    'WITH "q" AS (SELECT 1 AS "A"), p AS PROCEDURE () RETURNS VARCHAR LANGUAGE SQL AS \'BEGIN RETURN 1; END\' CALL p()',
    'CALL "MY_PROC"()',
  ])('rejects procedures without compiling: %s', async (sql) => {
    const compile = vi.fn();
    await expect(dialect.validateDSL(sql, compile)).rejects.toThrow('procedures are not allowed');
    expect(compile).not.toHaveBeenCalled();
  });

  it('allows the words procedure and call in identifiers, literals and comments', async () => {
    const compile = vi.fn().mockResolvedValue(undefined);
    const sql = 'SELECT "PROCEDURE", \'call me\' AS "note", $$PROCEDURE$$ AS "raw" FROM "VISITS" /* CALL */';
    await expect(dialect.validateDSL(sql, compile)).resolves.toBe(sql.replace(' /* CALL */', ''));
    expect(compile).toHaveBeenCalledOnce();
  });

  it('propagates the compilation error, which rejects anything but one query expression', async () => {
    const compile = vi
      .fn()
      .mockRejectedValue(new Error("SQL compilation error: syntax error line 1 at position 15 unexpected 'DELETE'."));
    await expect(dialect.validateDSL('DELETE FROM "ORDERS"', compile)).rejects.toThrow("unexpected 'DELETE'");
  });

  it.each(['SELECT SYSTEM$WAIT(10)', 'select system$cancel_all_queries(1)', 'SELECT "SYSTEM$ABORT_SESSION"(1)'])(
    'rejects SYSTEM$ functions without compiling: %s',
    async (sql) => {
      const compile = vi.fn();
      await expect(dialect.validateDSL(sql, compile)).rejects.toThrow('SYSTEM$ functions are not allowed');
      expect(compile).not.toHaveBeenCalled();
    }
  );

  it.each(['', '  ', ';', ' ;\n; '])('rejects empty statements: %j', async (sql) => {
    const compile = vi.fn();
    await expect(dialect.validateDSL(sql, compile)).rejects.toThrow('one read-only SELECT statement');
    expect(compile).not.toHaveBeenCalled();
  });
});

describe('Snowflake query generation', () => {
  it.each([
    ['SELECT 1', 'SELECT 1'],
    ['```sql\nSELECT 1\n```', 'SELECT 1'],
    ['SELECT \'```\' AS "value"', 'SELECT \'```\' AS "value"'],
  ])('extracts SQL without corrupting literals: %s', async (text, expected) => {
    vi.mocked(generateText).mockResolvedValue({ text, usage: {} } as never);
    await expect(dialect.getDSL('query', { models: [] })).resolves.toMatchObject({ dsl: expected });
  });

  it('asks for case-preserving quoted identifiers and returns the model usage', async () => {
    const usage = { inputTokens: 10, outputTokens: 2, totalTokens: 12 };
    vi.mocked(generateText).mockResolvedValue({ text: 'SELECT 1', usage } as never);
    const result = await new SnowflakeQueryDialect({ model: 'test', maxRetries: 0 }).getDSL('count rows', {
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
    expect(request.prompt).toContain('double quotes exactly as shown');
    expect(result).toEqual({ dsl: 'SELECT 1', usage });
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
