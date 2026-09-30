/**
 * Evidence chain — restructures the raw event trail from EventCollector into
 * a five-layer structured evidence chain, faithfully collecting what each
 * layer actually produced without heuristic inference or computation.
 *
 * Layers: source → definitions → executions → results → presentation
 */
import type { EvidenceRecord } from './collector';
import type { DataSourceConfig } from '../../types';

// ── Layer types ──────────────────────────────────────────────

/** Layer 1: Data source provenance. */
export type SourceEvidence = DataSourceConfig & {
  /** Timestamp when the source finished loading. */
  timestamp: number;
  /** Event seq of LOAD_END. */
  seq: number;
};

/** Layer 2: Metric definition — the DSL that encodes the query intent. */
export interface DefinitionEvidence {
  /** The DSL (SQL) that encodes the definition. */
  dsl: string;
  /** Event seq of TRANSLATE_END that produced this definition. */
  seq: number;
  /** Timestamp. */
  timestamp: number;
}

/** Layer 3: Actual execution. */
export interface ExecutionEvidence {
  /** Unique id within this chain. */
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
export interface ResultEvidence {
  /** Links back to ExecutionEvidence by id. */
  executionId: number;
  /** Column metadata from the execution result. */
  columns: { name: string; type?: string }[];
  /** The actual data rows. */
  rows: Record<string, unknown>[];
  /** Row count if known. */
  rowCount?: number;
}

/** Layer 5: Presentation — the final output the user sees. */
export interface PresentationEvidence {
  /** The natural-language summary text. */
  text: string;
  /** Chart type if visualization was produced. */
  chartType?: string;
  /** Chart syntax (GPT-Vis) if produced. */
  chartSyntax?: string;
  /** The query that started this analysis. */
  query: string;
  /** Event seq of the earliest evidence for this presentation. */
  seq: number;
}

/** The complete five-layer evidence chain. */
export interface EvidenceChainData {
  source: SourceEvidence | null;
  definitions: DefinitionEvidence[];
  executions: ExecutionEvidence[];
  results: ResultEvidence[];
  presentation: PresentationEvidence | null;
}

// ── EvidenceChain builder ───────────────────────────────────

/**
 * Restructures a raw event trail into a structured five-layer evidence chain.
 * Only collects what each layer actually produced — no heuristic inference.
 */
export class EvidenceChain {
  private data: EvidenceChainData = {
    source: null,
    definitions: [],
    executions: [],
    results: [],
    presentation: null,
  };

  constructor(private trail: readonly EvidenceRecord[]) {}

  /** Build the full evidence chain from the event trail. */
  build(): EvidenceChainData {
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

      const exec: ExecutionEvidence = {
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

    const chartType = (visualizeEnd?.data as { chartType?: string })?.chartType;
    const chartSyntax = (visualizeEnd?.data as { chartSyntax?: string })?.chartSyntax;

    if (!text && !chartType && !analyzeStart) return;

    this.data.presentation = {
      text,
      chartType,
      chartSyntax,
      query,
      seq: summarizeEnd?.seq ?? analyzeStart?.seq ?? 0,
    };
  }

  /** Serialize the evidence chain to JSON. */
  toJSON(): string {
    return JSON.stringify(this.data, null, 2);
  }
}
