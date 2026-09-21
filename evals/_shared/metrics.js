const metrics = new Map();

function registerMetric(name, evaluate) {
  if (!name || typeof evaluate !== 'function') throw new Error('Metric registration requires a name and evaluator.');
  metrics.set(name, evaluate);
}

function getMetrics(names) {
  return names.map((name) => {
    const evaluate = metrics.get(name);
    if (!evaluate) throw new Error(`Unknown metric "${name}". Available: ${[...metrics.keys()].join(', ')}`);
    return [name, evaluate];
  });
}

module.exports = { getMetrics, registerMetric };
