import { readFileSync } from 'node:fs';

import { readCsv } from './results.js';

function compactScores({ total, predicted, missing, metrics }) {
  return {
    total, predicted, missing,
    metrics: Object.fromEntries(Object.entries(metrics).map(([name, { passed, score }]) => [name, { passed, score }])),
  };
}

function buildReport(scores, samples, options, plugin = {}) {
  let metadata = options.metadata ? JSON.parse(readFileSync(options.metadata, 'utf8')) : {};
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('--metadata must contain a JSON object.');
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (!['environment', 'evaluation', 'provenance'].includes(key) || !value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('--metadata supports only environment, evaluation, and provenance objects.');
    }
  }
  metadata = JSON.parse(JSON.stringify(metadata), (key, value) => /sha256/i.test(key) ? undefined : value);
  const evaluation = { ...metadata.evaluation };
  if (evaluation.context) {
    evaluation.context = { ...evaluation.context };
    for (const key of ['schema', 'profile', 'semantic']) {
      if (Object.hasOwn(evaluation, key) && evaluation.context[key] === evaluation[key]) delete evaluation.context[key];
    }
  }

  const ids = new Set(samples.map((sample) => sample.id));
  const retained = new Map();
  const answer = (row) => String(row?.predicted_answer ?? row?.prediction ?? '');
  for (const path of options.predictions) {
    for (const row of readCsv(path)) {
      // Match predictionIndex: the last nonempty prediction wins across files.
      if (ids.has(row.id) && (answer(row) || !answer(retained.get(row.id)))) retained.set(row.id, row);
    }
  }
  const rows = [...retained.values()];
  const numbers = (column) => rows.flatMap((row) => {
    const value = row[column];
    const number = Number(value);
    return value != null && value.trim() !== '' && Number.isFinite(number) && number >= 0 ? [number] : [];
  });
  const sum = (values) => values.reduce((total, value) => total + value, 0);
  const round = (value) => Math.round(value * 100) / 100;
  const durations = numbers('duration_ms').map((value) => value / 1000).sort((a, b) => a - b);
  const middle = Math.floor(durations.length / 2);
  const inputs = numbers('input_tokens');
  const outputs = numbers('output_tokens');
  const tokens = numbers('total_tokens');
  const execution = rows.filter((row) => row.error);
  const models = [...new Set(rows.map((row) => row.model).filter(Boolean))];
  return {
    generatedAt: new Date().toISOString(),
    // This is the scoring runtime; original execution versions must be supplied.
    environment: { scoringNodeVersion: process.version, ...metadata.environment },
    evaluation: {
      benchmark: plugin.title ?? options.dataset,
      ...evaluation,
      dataset: options.dataset,
      model: models.length === 1 ? models[0] : models.length ? models : metadata.evaluation?.model ?? null,
      predictions: options.predictions.length === 1 ? options.predictions[0] : options.predictions,
    },
    summary: {
      ...compactScores(scores),
      timingSeconds: {
        average: durations.length ? round(sum(durations) / durations.length) : null,
        minimum: durations.length ? round(durations[0]) : null,
        maximum: durations.length ? round(durations[durations.length - 1]) : null,
        median: durations.length ? round((durations[middle] + durations[Math.floor((durations.length - 1) / 2)]) / 2) : null,
      },
      tokens: {
        prompt: inputs.length ? sum(inputs) : null,
        completion: outputs.length ? sum(outputs) : null,
        total: tokens.length ? sum(tokens) : null,
        average: tokens.length ? Math.round(sum(tokens) / tokens.length) : null,
      },
    },
    provenance: {
      ...metadata.provenance,
      statisticsScope: 'Final retained CSV rows matching scored samples, including failed executions; excludes superseded attempts and retry overhead. Each timing/token statistic uses only rows with a recorded nonnegative finite value.',
      scoringScope: `Shared ${Object.keys(scores.metrics).join(', ')} metrics only; skill/tool assertions are separate.`,
      recordedRows: { duration: durations.length, inputTokens: inputs.length, outputTokens: outputs.length, totalTokens: tokens.length },
    },
    errors: {
      execution: execution.map((row) => ({ id: row.id, error: row.error })),
    },
    suites: Object.fromEntries(Object.entries(scores.suites).map(([name, result]) => [name, compactScores(result)])),
    failures: scores.failures,
  };
}

export { buildReport };
