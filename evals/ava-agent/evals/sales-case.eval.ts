import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { defineEval, defineEvalConfig, type EveEvalSession } from 'eve/evals';
import { z } from 'zod';
import { removeSessionContainers } from '../lib/cleanup.mjs';

export const config = defineEvalConfig({ maxConcurrency: 2, timeoutMs: 600000 });

const metricNames = [
  'net_sales_baseline_cents', 'net_sales_current_cents',
  'ad_spend_baseline_cents', 'ad_spend_current_cents',
  'contribution_before_ads_baseline_cents', 'contribution_before_ads_current_cents',
] as const;
const outputSchema = z.object({
  answer: z.string(),
  metrics: z.object(Object.fromEntries(metricNames.map(name => [name, z.number().nullable()]))),
});

export async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({ args: argv, options: {
    skill: { type: 'string', default: 'ava' }, repeats: { type: 'string', default: '2' },
    list: { type: 'boolean' }, semantic: { type: 'boolean' },
  } });
  const repeats = Number(values.repeats);
  if (!Number.isInteger(repeats) || repeats < 1 || repeats > 3) throw new Error('--repeats must be 1–3');
  if (!['none', 'ava'].includes(values.skill!)) throw new Error('--skill must be none or ava');
  const semantic = values.skill === 'ava' || !!values.semantic;
  const data = resolve(import.meta.dirname, '../../../dev-data');
  const files = ['sales-investment.sqlite', 'business-context.md', 'semantic.json'];
  const hashes = Object.fromEntries(files.map(file => [file,
    createHash('sha256').update(readFileSync(join(data, file))).digest('hex')]));
  const { run } = await import(new URL('../scripts/run.mjs', import.meta.url).href);
  const result = await run('eval', ['sales-case', '--skill', values.skill!, ...(values.list ? ['--list'] : [])], (directory: string) => {
    mkdirSync(join(directory, 'evals/fixtures'), { recursive: true });
    mkdirSync(join(directory, 'records'));
    mkdirSync(join(directory, 'artifacts'));
    const agentPath = join(directory, 'agent/agent.ts');
    const agent = readFileSync(agentPath, 'utf8');
    if (!agent.includes('maxInputTokensPerSession: 200000') || !agent.includes('maxOutputTokensPerSession: 24000')) {
      throw new Error('Review the case token budget after changing the base agent limits.');
    }
    writeFileSync(agentPath, agent.replace('maxInputTokensPerSession: 200000', 'maxInputTokensPerSession: 1000000')
      .replace('maxOutputTokensPerSession: 24000', 'maxOutputTokensPerSession: 32000'));
    copyFileSync(join(data, 'sales-investment.sqlite'), join(directory, 'evals/fixtures/0.sqlite'));
    copyFileSync(join(data, 'business-context.md'), join(directory, 'evals/fixtures/business-context.md'));
    if (semantic) copyFileSync(join(data, 'semantic.json'), join(directory, 'evals/fixtures/semantic.json'));
    writeFileSync(join(directory, 'evals/evals.config.ts'), "export { config as default } from './sales-case.eval.ts';\n");
    writeFileSync(join(directory, 'evals/selection.json'), JSON.stringify({ repeats, semantic }));
    return { manifest: { benchmark: 'sales-case', repeats, semantic, hashes,
      limits: { maxInputTokensPerSession: 1000000, maxOutputTokensPerSession: 32000, timeoutMs: 600000 },
      comparison: 'Identical model, business rules, SQLite data, output requirements and token/time limits. Arms: none; none plus same Semantic JSON; AVA Skill plus Semantic JSON. Skill and AVA tools are evaluated together.' } };
  });
  console.log(`Sales case results: ${result.directory}`);
}

export async function createEvals() {
  const directory = process.env.AVA_AGENT_RUN_DIR!;
  const { repeats, semantic } = JSON.parse(readFileSync(join(directory, 'evals/selection.json'), 'utf8'));
  const context = readFileSync(join(directory, 'evals/fixtures/business-context.md'), 'utf8');
  const hasAVA = process.env.AVA_AGENT_SKILL === 'ava';
  return Array.from({ length: repeats }, (_, index) => defineEval({
    description: `sales-case-${index + 1}: 净销售额下降，要不要加大投放？`, tags: ['sales-case'],
    async test(t) {
      const started = Date.now();
      let session: EveEvalSession | undefined;
      let result: unknown;
      let error = '';
      let artifactError = '';
      try {
        session = await t.session();
        const message: Parameters<EveEvalSession['send']>[0] = [{
          type: 'text', text: `净销售额下降，要不要加大投放？
请基于附件中的完整 SQLite 数据进行经营分析，核验变化、追查主要来源，并给出有证据的投放建议及仍不确定的事项。使用下列双方共享的业务口径，不需要向用户追问。
保留实际执行的查询、关键结果和分析报告到 /workspace/output，制作一张支持核心结论的 HTML 图表。最终用中文回答，并按输出结构填入默认比较期间的六项金额指标，单位为整数分；无法核验的指标填 null，不要猜测。
${hasAVA ? '本组可使用 AVA Skill 和附带的 semantic.json 结构化业务模型。可以按需读取该模型；refSql 与 Cube 是语义定义，不会自动建表，SQL 查询须展开相关表达式。当前 CLI 没有 semantic 设置命令；可以读取 JSON 作为业务模型使用，或通过 /opt/ava/lib 的 AVA SDK 调用 semantic()。' : '本组使用通用 bash/Python 和 SQLite 分析，不使用 AVA CLI、AVA SDK 或 AVA Skill。'}
${!hasAVA && semantic ? '另附同一份 semantic.json 作为可阅读的结构化业务定义，其中包含可复用的 SQL 和指标表达式；可按需展开到自己的查询中。' : ''}

${context}`,
        }, {
          type: 'file', data: new URL('ava-fixture:0.sqlite'), filename: 'sales-investment.sqlite', mediaType: 'application/vnd.sqlite3',
        }];
        if (semantic) message.push({ type: 'file',
          data: `data:application/json;base64,${readFileSync(join(directory, 'evals/fixtures/semantic.json')).toString('base64')}`,
          filename: 'semantic.json', mediaType: 'application/json' });
        const turn = await session.send(message, { outputSchema });
        turn.expectOk();
        if (turn.data === undefined) throw new Error(`No structured answer: status=${turn.status}; input requests=${turn.inputRequests.length}; check events and token limits`);
        result = outputSchema.parse(turn.data);
        t.succeeded();
        if (hasAVA) t.loadedSkill('ava', { status: 'completed' }).gate();
        else t.notCalledTool('load_skill');
      } catch (cause) {
        error = cause instanceof Error ? cause.message : String(cause);
        throw cause;
      } finally {
        if (session) {
          try {
            const ids = execFileSync('docker', ['ps', '-q', '--filter', 'label=eve.sandbox=1',
              '--filter', 'label=eve.sandbox.role=session', '--filter', `label=eve.sandbox.tag.sessionId=${session.sessionId}`],
            { encoding: 'utf8', timeout: 30000 }).trim().split(/\s+/).filter(Boolean);
            if (ids.length !== 1) throw new Error('Expected exactly one session container');
            const bytes = Number(execFileSync('docker', ['exec', ids[0], 'du', '-sb', '/workspace/output'],
              { encoding: 'utf8', timeout: 30000 }).split(/\s+/)[0]);
            if (bytes > 32 * 1024 * 1024) throw new Error('Artifacts exceed 32 MiB');
            execFileSync('docker', ['cp', `${ids[0]}:/workspace/output`, join(directory, 'artifacts', `run-${index + 1}`)], { timeout: 30000 });
          } catch (cause) { artifactError = String(cause); }
          writeFileSync(join(directory, 'records', `run-${index + 1}.transcript.txt`), session.transcript);
          writeFileSync(join(directory, 'records', `run-${index + 1}.events.json`), JSON.stringify(session.events));
        }
        const usage = session?.events.flatMap(e => e.type === 'step.completed' ? [e.data.usage] : []) ?? [];
        const total = (name: 'inputTokens' | 'outputTokens') => usage.length && usage.every(u => u?.[name] != null)
          ? usage.reduce((sum, u) => sum + u![name]!, 0) : null;
        writeFileSync(join(directory, 'records', `run-${index + 1}.json`), JSON.stringify({
          id: index + 1, skill: hasAVA ? 'ava' : 'none', semantic, result, error, artifactError,
          sessionId: session?.sessionId, durationMs: Date.now() - started,
          inputTokens: total('inputTokens'), outputTokens: total('outputTokens'), steps: usage.length,
        }, null, 2));
        if (session) await removeSessionContainers(session.sessionId).catch(cause => console.error(`Cleanup failed: ${cause.message}`));
      }
    },
  }));
}

export default process.env.AVA_AGENT_BENCHMARK === 'sales-case' ? await createEvals() : [];

if (!process.env.AVA_AGENT_RUN_DIR && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
