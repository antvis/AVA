import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { JavaScriptDialect } from '../../src/query/javascript';
import { PythonDialect } from '../../src/query/python';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../src/util/model', () => ({ languageModel: vi.fn(() => 'test-model') }));
const parserState = vi.hoisted(() => ({ javascript: 0, python: 0 }));
vi.mock('acorn', async (importOriginal) => {
  parserState.javascript += 1;
  return importOriginal();
});
vi.mock('@lezer/python', async (importOriginal) => {
  parserState.python += 1;
  return importOriginal();
});

afterEach(() => vi.clearAllMocks());

describe.each([
  {
    id: 'javascript' as const,
    create: () => new JavaScriptDialect({ model: 'test', maxRetries: 0 }),
    fence: 'js',
    code: "const result = '```';",
    valid: [
      '// 中文😀\nconst result = `value: ${data[0]?.value ?? 0}`;',
      'const {value} = data[0];\nconst result = [1, 2].map(n => n + value);',
    ],
    invalid: ['', 'const result =', 'return 1;', 'export const result = 1;'],
    notExecuted: "throw new Error('must not execute');",
  },
  {
    id: 'python' as const,
    create: () => new PythonDialect({ model: 'test', maxRetries: 0 }),
    fence: 'py',
    code: "result = '```'",
    valid: [
      "# 中文😀\ndef total(frame):\n    return frame['value'].sum()\nresult = total(df)",
      "   # comment\nresult = '''中文😀\n  literal indentation'''\n",
    ],
    invalid: ['', 'result = (', 'if True\n    result = 1', 'if True:\nresult = 1', '\n  result = 1', "result = '\0'"],
    notExecuted: "raise RuntimeError('must not execute')",
  },
])('$id query language', ({ id, create, fence, code, valid, invalid, notExecuted }) => {
  const dialect = create();

  it('loads the parser only for validation', async () => {
    vi.mocked(generateText).mockResolvedValue({ text: code, finishReason: 'stop' } as never);
    expect(parserState[id]).toBe(0);
    await expect(dialect.getDSL('one', { models: [] })).resolves.toMatchObject({ dsl: code });
    expect(parserState[id]).toBe(0);
    await dialect.validateDSL(code);
    expect(parserState[id]).toBe(1);
  });

  it('extracts code and preserves rules, context and usage', async () => {
    const usage = { inputTokens: 10, outputTokens: 5, totalTokens: 15 };
    vi.mocked(generateText).mockResolvedValue({ text: `\`\`\`${fence}\n${code}\n\`\`\``, finishReason: 'stop', usage } as never);
    const result = await dialect.getDSL('count orders', {
      models: [{ name: 'orders', columns: [], metrics: { row_count: 42 } }],
    });
    expect(result).toEqual({ dsl: code, usage });
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ maxRetries: 0 }));
    const prompt = vi.mocked(generateText).mock.calls[0][0].prompt;
    for (const context of [dialect.rules, 'count orders', 'orders', '42']) expect(prompt).toContain(context);
  });

  it.each([
    { finishReason: 'length', empty: false, error: 'did not complete' },
    { finishReason: 'stop', empty: true, error: 'empty code' },
  ])('rejects unusable generation: $error', async ({ finishReason, empty, error }) => {
    vi.mocked(generateText).mockResolvedValue({ text: empty ? `\`\`\`${fence}\n\n\`\`\`` : code, finishReason } as never);
    await expect(dialect.getDSL('one', { models: [] })).rejects.toThrow(error);
  });

  it.each(valid)('preserves valid source, literals, comments and indentation: %s', async (source) => {
    await expect(dialect.validateDSL(source)).resolves.toBe(source);
  });

  it('parses without executing user code', async () => {
    await expect(dialect.validateDSL(notExecuted)).resolves.toBe(notExecuted);
  });

  it.each(invalid)('rejects invalid or empty code: %s', async (source) => {
    await expect(dialect.validateDSL(source)).rejects.toThrow();
  });
});
