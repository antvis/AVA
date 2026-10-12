const { resolve } = require('node:path');

const { readCsv } = require('./results');

const datasets = new Map();
const metrics = new Map();

function getDataset(name) {
  const plugin = datasets.get(name);
  if (!plugin) throw new Error(`Unknown dataset "${name}". Available: ${[...datasets.keys()].join(', ')}`);
  return plugin;
}

function registerPlugin(plugin) {
  if (!plugin || typeof plugin !== 'object') throw new Error('Plugin must export an object.');
  if (!plugin.name || typeof plugin.load !== 'function') throw new Error('Dataset plugin requires a name and load function.');
  if (plugin.defaultMetrics && !Array.isArray(plugin.defaultMetrics)) throw new Error('defaultMetrics must be an array.');
  const entries = Object.entries(plugin.metrics ?? {});
  for (const [name, metric] of entries) {
    if (!name || typeof metric !== 'function') throw new Error('Plugin metrics must be named functions.');
  }
  datasets.set(plugin.name, plugin);
  for (const [name, metric] of entries) metrics.set(name, metric);
  return plugin;
}

function loadPlugin(path) {
  const exported = require(resolve(path));
  const plugins = Array.isArray(exported) ? exported : [exported.default ?? exported];
  return plugins.map(registerPlugin);
}

function predictionIndex(paths) {
  const predictions = new Map();
  for (const path of paths) {
    readCsv(path).forEach((row) => {
      const prediction = String(row.predicted_answer ?? row.prediction ?? '');
      if (!prediction) return;
      if (row.id) predictions.set(String(row.id), prediction);
    });
  }
  return predictions;
}

async function evaluate({ samples, predictions, metricNames }) {
  if (!Array.isArray(metricNames) || !metricNames.length) throw new Error('At least one scoring metric is required.');
  const selectedMetrics = metricNames.map((name) => {
    const metric = metrics.get(name);
    if (!metric) throw new Error(`Unknown metric "${name}". Available: ${[...metrics.keys()].join(', ')}`);
    return [name, metric];
  });
  const newSummary = () => ({
    total: 0,
    predicted: 0,
    metrics: Object.fromEntries(selectedMetrics.map(([name]) => [name, 0])),
  });
  const aggregate = newSummary();
  const suites = new Map();
  const failures = [];

  for (const sample of samples) {
    const suite = suites.get(sample.suite) ?? newSummary();
    suites.set(sample.suite, suite);
    aggregate.total += 1;
    suite.total += 1;
    const prediction = predictions.get(sample.id);
    if (prediction !== undefined) {
      aggregate.predicted += 1;
      suite.predicted += 1;
    }
    const scores = {};
    for (const [name, metric] of selectedMetrics) {
      const passed = prediction !== undefined && Boolean(await metric(prediction, sample));
      scores[name] = passed;
      if (passed) {
        aggregate.metrics[name] += 1;
        suite.metrics[name] += 1;
      }
    }
    if (prediction === undefined || Object.values(scores).some((score) => !score)) {
      failures.push({
        id: sample.id,
        prediction: prediction ?? null,
        gold: sample.goldAnswer,
        scores,
      });
    }
  }

  const finalize = (summary) => ({
    total: summary.total,
    predicted: summary.predicted,
    missing: summary.total - summary.predicted,
    metrics: Object.fromEntries(
      selectedMetrics.map(([name]) => [
        name,
        {
          passed: summary.metrics[name],
          total: summary.total,
          score: summary.total ? summary.metrics[name] / summary.total : 0,
        },
      ]),
    ),
  });

  return {
    ...finalize(aggregate),
    suites: Object.fromEntries([...suites].map(([name, summary]) => [name, finalize(summary)])),
    failures,
  };
}

module.exports = {
  evaluate,
  getDataset,
  loadPlugin,
  predictionIndex,
  registerPlugin,
};
