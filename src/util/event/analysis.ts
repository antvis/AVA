/**
 * Analysis — restructures the raw event trail from EventCollector into
 * a five-layer structured analysis record, faithfully collecting what each
 * layer actually produced without heuristic inference or computation.
 *
 * Layers: source → definitions → executions → results → presentation
 */
import type { AnalysisRecord } from './collector';
import type { DataSourceConfig } from '../../types';

// ── Layer types ──────────────────────────────────────────────

/** Layer 1: Data source provenance. */
export type SourceLayer = DataSourceConfig & {
  /** Timestamp when the source finished loading. */
  timestamp: number;
  /** Event seq of LOAD_END. */
  seq: number;
};

/** Layer 2: Metric definition — the DSL that encodes the query intent. */
export interface DefinitionLayer {
  /** The DSL (SQL) that encodes the definition. */
  dsl: string;
  /** Event seq of TRANSLATE_END that produced this definition. */
  seq: number;
  /** Timestamp. */
  timestamp: number;
}

/** Layer 3: Actual execution. */
export interface ExecutionLayer {
  /** Unique id within this analysis. */
  id: number;
  /** The DSL/SQL statement that was executed. */
  sql: string;
  /** 'success' or 'error'. */
  status: 'success' | 'error';
  /** Error message if status is 'error'. */
  error?: string;
  /** Whether the result was truncated. */
  truncated?: boolean;
  /** What caused truncation. */
  truncatedBy?: 'maxRows' | 'maxResultBytes';
  /** Whether this was an exploratory query (loop EXPLORE) or the answer query. */
  exploratory: boolean;
  /** Event seq of QUERY_START. */
  startSeq: number;
  /** Event seq of QUERY_END. */
  endSeq: number;
}

/** Layer 4: Query result — raw data returned by the engine. */
export interface ResultLayer {
  /** Links back to ExecutionLayer by id. */
  executionId: number;
  /** Column metadata from the execution result. */
  columns: { name: string; type?: string }[];
  /** The actual data rows. */
  rows: Record<string, unknown>[];
  /** Row count if known. */
  rowCount?: number;
}

/** Layer 5: Presentation — the final output the user sees. */
export interface PresentationLayer {
  /** The natural-language summary text. */
  text: string;
  /** Chart syntax (GPT-Vis) if produced. */
  chartSyntax?: string;
  /** The query that started this analysis. */
  query: string;
  /** Event seq of the earliest record for this presentation. */
  seq: number;
}

/** The complete five-layer analysis record. */
export interface AnalysisData {
  source: SourceLayer | null;
  definitions: DefinitionLayer[];
  executions: ExecutionLayer[];
  results: ResultLayer[];
  presentation: PresentationLayer | null;
}

// ── Analysis builder ───────────────────────────────────────

/**
 * Restructures a raw event trail into a structured five-layer analysis record.
 * Only collects what each layer actually produced — no heuristic inference.
 */
export class AnalysisBuilder {
  private data: AnalysisData = {
    source: null,
    definitions: [],
    executions: [],
    results: [],
    presentation: null,
  };

  constructor(private trail: readonly AnalysisRecord[]) {}

  /** Build the full analysis from the event trail. */
  build(): AnalysisData {
    this.buildSource();
    this.buildDefinitions();
    this.buildExecutions();
    this.buildPresentation();
    return this.data;
  }

  private buildSource(): void {
    const loadEnd = this.trail.find((r) => r.type === 'loadend' && !r.isError);
    if (!loadEnd) return;

    const loadStart = this.trail.find((r) => r.type === 'loadstart');
    const source = (loadStart?.data as DataSourceConfig | null) ?? null;
    if (!source) return;

    this.data.source = {
      ...source,
      timestamp: loadEnd.timestamp,
      seq: loadEnd.seq,
    };
  }

  private buildDefinitions(): void {
    const translateEnds = this.trail.filter((r) => r.type === 'translateend' && !r.isError);

    for (const record of translateEnds) {
      const dsl = (record.data as { dsl?: string })?.dsl ?? '';
      this.data.definitions.push({
        dsl,
        seq: record.seq,
        timestamp: record.timestamp,
      });
    }
  }

  private buildExecutions(): void {
    const queryStarts = this.trail.filter((r) => r.type === 'querystart');
    const queryEnds = this.trail.filter((r) => r.type === 'queryend');

    let executionId = 0;

    for (const start of queryStarts) {
      const dsl = (start.data as { dsl?: string })?.dsl ?? '';
      // Find the matching QUERY_END: next queryend after this querystart
      const end = queryEnds.find((e) => e.seq > start.seq);

      // Determine if this was exploratory: check the REASON_END immediately before
      const precedingReason = this.trail
        .filter((r) => r.type === 'reasonend' && r.seq < start.seq)
        .pop();
      const action = (precedingReason?.data as { action?: string })?.action;
      const exploratory = action === 'EXPLORE';

      const isError = end?.isError ?? false;
      const error = isError
        ? ((end?.data as { error?: { message?: string } })?.error?.message ?? 'Unknown error')
        : undefined;

      const exec: ExecutionLayer = {
        id: executionId,
        sql: dsl,
        status: isError ? 'error' : 'success',
        error,
        truncated: (end?.data as { truncated?: boolean })?.truncated,
        truncatedBy: (end?.data as { truncatedBy?: string })?.truncatedBy as
          | 'maxRows'
          | 'maxResultBytes'
          | undefined,
        exploratory,
        startSeq: start.seq,
        endSeq: end?.seq ?? -1,
      };

      this.data.executions.push(exec);

      // Collect result for successful executions
      if (!isError && end) {
        const resultData = end.data as {
          schema?: { name: string; type?: string }[];
          data?: Record<string, unknown>[];
          rowCount?: number;
        } | null;

        this.data.results.push({
          executionId,
          columns: resultData?.schema ?? [],
          rows: resultData?.data ?? [],
          rowCount: resultData?.rowCount,
        });
      }

      executionId++;
    }
  }

  private buildPresentation(): void {
    const summarizeEnd = this.trail
      .filter((r) => r.type === 'summarizeend' && !r.isError)
      .pop();
    const analyzeStart = this.trail.find((r) => r.type === 'analyzestart');
    const query = (analyzeStart?.data as { query?: string })?.query ?? '';
    const text = (summarizeEnd?.data as { text?: string })?.text ?? '';

    const visualizeEnd = this.trail
      .filter((r) => r.type === 'visualizeend' && !r.isError)
      .pop();

    const chartSyntax = (visualizeEnd?.data as { syntax?: string })?.syntax;

    if (!text && !chartSyntax && !analyzeStart) return;

    this.data.presentation = {
      text,
      chartSyntax,
      query,
      seq: summarizeEnd?.seq ?? analyzeStart?.seq ?? 0,
    };
  }

  /** Serialize the analysis to JSON. */
  toJSON(): string {
    return JSON.stringify(this.data, null, 2);
  }
}

// ── HTML rendering ─────────────────────────────────────────

/** Escape HTML special characters to prevent injection. */
function escapeHTML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Escape content for safe embedding inside a JS template literal. */
function escapeTemplateLiteral(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/<\/script>/g, '<\\/script>');
}

/** Render the analysis as a minimal, Vercel-style report. */
export function renderReportHTML(data: AnalysisData): string {
  const p = data.presentation;
  if (!p) return '<!DOCTYPE html><html><body><p>No presentation data.</p></body></html>';

  const hasChart = !!p.chartSyntax;
  const chartSyntaxEscaped = hasChart ? escapeTemplateLiteral(p.chartSyntax!) : '';
  const summaryEscaped = escapeHTML(p.text);

  // Build data table from the first result set
  const result = data.results[0];
  const tableCols = result ? result.columns.map((c) => `<th>${escapeHTML(c.name)}</th>`).join('') : '';
  const tableRows = result
    ? result.rows.map((row) => `<tr>${result.columns.map((c) => `<td>${escapeHTML(String(row[c.name] ?? ''))}</td>`).join('')}</tr>`).join('\n')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Report</title>
  ${hasChart ? '<script src="https://cdn.jsdmirror.com/npm/@antv/gpt-vis/dist/umd/index.min.js"></script>' : ''}
  <script src="https://cdn.jsdmirror.com/npm/marked/marked.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: #fff;
      color: #111;
      max-width: 720px;
      margin: 0 auto;
      padding: 64px 24px;
      line-height: 1.6;
    }
    .question {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-bottom: 32px;
      line-height: 1.3;
    }
    .answer {
      font-size: 15px;
      color: #333;
      margin-bottom: 40px;
    }
    .answer > *:first-child { margin-top: 0; }
    .answer h1 { font-size: 20px; margin: 20px 0 8px; font-weight: 600; }
    .answer h2 { font-size: 18px; margin: 18px 0 8px; font-weight: 600; }
    .answer h3 { font-size: 16px; margin: 14px 0 6px; font-weight: 600; }
    .answer p { margin: 10px 0; }
    .answer ul { margin: 10px 0; padding-left: 20px; }
    .answer li { margin: 4px 0; }
    .answer strong { font-weight: 600; }
    .answer code { font-family: 'SF Mono', Menlo, monospace; font-size: 13px; background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    .answer pre { margin: 12px 0; }
    .answer pre code { display: block; background: #f8f8f8; padding: 16px; border-radius: 6px; overflow-x: auto; }
    .tabs {
      display: flex;
      border-bottom: 1px solid #eee;
      margin-bottom: 20px;
    }
    .tab {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      color: #999;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: color .15s, border-color .15s;
    }
    .tab:hover { color: #333; }
    .tab.active { color: #111; border-bottom-color: #111; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    #chart-container { width: 100%; min-height: 300px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { text-align: left; padding: 8px 12px; font-weight: 600; color: #666; border-bottom: 1px solid #eaeaea; }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid #f4f4f4; }
    .data-table tbody tr:hover { background: #fafafa; }
  </style>
</head>
<body>
  <div class="question">${escapeHTML(p.query)}</div>
  <div class="answer" data-markdown="${summaryEscaped}"></div>

  ${(hasChart && result) ? `<div class="tabs">
    <div class="tab active" data-target="chart">Chart</div>
    <div class="tab" data-target="table">Table</div>
  </div>
  <div class="tab-content active" id="chart-pane">
    <div id="chart-container"></div>
  </div>
  <div class="tab-content" id="table-pane">
    <table class="data-table">
      <thead><tr>${tableCols}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>` : hasChart ? `<div id="chart-container"></div>` : result ? `<table class="data-table">
    <thead><tr>${tableCols}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>` : ''}

  <script>
    document.querySelectorAll('[data-markdown]').forEach(el => {
      el.innerHTML = marked.parse(el.dataset.markdown);
    });
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.target + '-pane').classList.add('active');
      });
    });
  </script>
  ${hasChart ? `<script>
    const gptVis = new GPTVis.GPTVis({ container: '#chart-container' });
    gptVis.render(\`${chartSyntaxEscaped}\`);
  </script>` : ''}
</body>
</html>`;
}
