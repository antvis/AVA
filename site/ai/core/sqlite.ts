import { generateText } from 'ai';
import { registerEngine } from '@antv/ava/browser';
import type {
  AnalysisEngine,
  DataModel,
  DataSourceConfig,
  ExecutionOptions,
  ExecutionResult,
  LLMConfig,
  Profile,
  Schema,
} from '@antv/ava/browser';
import { createModel } from './model';

export class BrowserSQLiteEngine implements AnalysisEngine {
  readonly language = {
    name: 'SQLite SQL',
    fence: 'sql',
    instructions:
      'Use one read-only SQLite SELECT or WITH statement. All tables and views are available; preserve fact grains when joining.',
  };
  private worker?: Worker;
  private nextId = 0;
  private pending = new Map<
    number,
    { resolve: (value: any) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }
  >();
  constructor(private llm: LLMConfig, private options: Record<string, unknown> = {}) {}

  private call<T>(method: string, payload?: unknown): Promise<T> {
    if (!this.worker) return Promise.reject(new Error('Reload the SQLite source before querying.'));
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => {
        void this.dispose(new Error('SQLite operation exceeded 30 seconds. Reload the source to retry.'));
      }, 30000);
      this.pending.set(id, { resolve, reject, timer });
      this.worker!.postMessage({ id, method, payload });
    });
  }

  async load(config: DataSourceConfig): Promise<void> {
    if (config.type !== 'sqlite' || !(this.options.bytes instanceof Uint8Array))
      throw new Error('Select a SQLite database file.');
    await this.dispose();
    this.worker = new Worker(new URL('./sqlite.worker.js', import.meta.url));
    this.worker.onmessage = ({ data }) => {
      const pending = this.pending.get(data.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(data.id);
      if (data.error) pending.reject(new Error(data.error));
      else pending.resolve(data.result);
    };
    this.worker.onerror = (event) => {
      void this.dispose(new Error(event.message || 'SQLite worker failed.'));
    };
    await this.call('load', this.options.bytes);
  }
  schema(): Promise<Schema> {
    return this.call('schema');
  }
  profile(): Promise<Profile> {
    return this.call('profile');
  }
  execute<T = Record<string, unknown>>(sql: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    return this.call('query', { sql, options });
  }
  async getDSL(query: string, dataModel: DataModel) {
    const { text, usage } = await generateText({
      model: createModel(this.llm),
      maxRetries: this.llm.maxRetries ?? 0,
      prompt: `Generate one read-only SQLite SQL query. Return only SQL, without prose. Respect the supplied metric definitions, primary keys, fact grains and snapshot date. Use all necessary tables and joins; never invent data.\nData model:\n${JSON.stringify(
        dataModel
      )}\nQuestion:\n${query}`,
    });
    return {
      dsl: text
        .trim()
        .replace(/^```(?:sql|sqlite)?\s*|\s*```$/gi, '')
        .trim(),
      usage,
    };
  }
  async dispose(error = new Error('SQLite session closed.')): Promise<void> {
    this.worker?.terminate();
    this.worker = undefined;
    for (const item of this.pending.values()) {
      clearTimeout(item.timer);
      item.reject(error);
    }
    this.pending.clear();
  }
}

registerEngine('sqlite-wasm', BrowserSQLiteEngine);

export async function inspectSQLite(bytes: Uint8Array) {
  const engine = new BrowserSQLiteEngine({ model: '' }, { bytes });
  try {
    await engine.load({ type: 'sqlite', options: { path: 'upload.sqlite' } });
    const schema = await engine.schema();
    const profile = await engine.profile();
    const physical = await engine.execute<{ name: string }>(
      "SELECT name FROM sqlite_schema WHERE type='table' AND substr(name,1,7)!='sqlite_'",
      { maxRows: 1000000 }
    );
    const names = new Set(physical.data.map((table) => table.name));
    const rowCount = profile.models
      .filter((table) => names.has(table.name))
      .reduce((sum, table) => sum + Number(table.metrics.row_count), 0);
    const first = schema.models[0];
    const preview = await engine.execute('SELECT * FROM "' + first.name.replaceAll('"', '""') + '" LIMIT 5');
    return { schema, profile, rowCount, preview: preview.data };
  } finally {
    await engine.dispose();
  }
}
