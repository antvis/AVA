import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { JavaScriptDialect } from '../../src/query/javascript';
import { PythonDialect } from '../../src/query/python';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../src/util/model', () => ({ languageModel: vi.fn(() => 'test-model') }));
const executePython = vi.fn().mockResolvedValue({ data: [], schema: [], rowCount: 0 });

afterEach(() => vi.clearAllMocks());

describe.each([
  {
    id: 'javascript' as const,
    create: () => new JavaScriptDialect({ model: 'test', maxRetries: 0 }),
    fence: 'js',
    code: "const result = '```';",
    sources: [
      '// 中文😀\nconst result = `value: ${data[0]?.value ?? 0}`;',
      'const result =',
    ],
    invalid: ['', ' \n\t'],
    notExecuted: "throw new Error('must not execute');",
  },
  {
    id: 'python' as const,
    create: () => new PythonDialect({ model: 'test', maxRetries: 0 }, executePython),
    fence: 'py',
    code: "result = '```'",
    sources: [
      "# 中文😀\ndef total(frame):\n    return frame['value'].sum()\nresult = total(df)",
      "   # comment\nresult = '''中文😀\n  literal indentation'''\n",
    ],
    invalid: ['', "result = '\0'"],
    notExecuted: "raise RuntimeError('must not execute')",
  },
])('$id query language', ({ id, create, fence, code, sources, invalid, notExecuted }) => {
  const dialect = create();

  it('generates code without invoking the Python executor', async () => {
    vi.mocked(generateText).mockResolvedValue({ text: code, finishReason: 'stop' } as never);
    expect(executePython).not.toHaveBeenCalled();
    await expect(dialect.getDSL('one', { models: [] })).resolves.toMatchObject({ dsl: code });
    expect(executePython).not.toHaveBeenCalled();
    await dialect.validateDSL(code);
    expect(executePython).toHaveBeenCalledTimes(id === 'python' ? 1 : 0);
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

  it.each(sources)('preserves source, literals, comments and indentation: %s', async (source) => {
    await expect(dialect.validateDSL(source)).resolves.toBe(source);
  });

  it('checks input without executing user code', async () => {
    await expect(dialect.validateDSL(notExecuted)).resolves.toBe(notExecuted);
  });

  it.each(invalid)('rejects invalid or empty code: %s', async (source) => {
    await expect(dialect.validateDSL(source)).rejects.toThrow();
  });
});

it('propagates failures from the configured Python compiler', async () => {
  const failure = new Error('SyntaxError: invalid syntax');
  executePython.mockRejectedValueOnce(failure);
  const dialect = new PythonDialect({ model: 'test' }, executePython);
  await expect(dialect.validateDSL('result = (')).rejects.toBe(failure);
  expect(executePython).toHaveBeenCalledOnce();
  expect(executePython.mock.calls[0][0]).toContain('compile(json.loads(');
});

describe.skipIf(process.env.AVA_PYTHON_LOCAL_TEST !== '1')('Python official compiler', () => {
  const dialect = new PythonDialect({ model: 'unused' });

  it('preserves source without executing code or resolving data bindings', async () => {
    const code = "# 中文😀\ndef total(frame):\n    return frame['value'].sum()\nresult = total(df)\nraise RuntimeError('must not execute')\n";
    await expect(dialect.validateDSL(code)).resolves.toBe(code);
  });

  it.each(['result = (', 'if True:\nresult = 1', '  result = 1', 'return 1'])(
    'rejects code that Python cannot compile: %s',
    async (code) => {
      await expect(dialect.validateDSL(code)).rejects.toThrow(/SyntaxError|IndentationError/);
    }
  );
});
