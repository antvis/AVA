const { readFileSync } = require('node:fs');

const { parse } = require('csv-parse/sync');

const datasets = new Map();

function registerDataset(name, plugin) {
  if (typeof name === 'object' && name !== null) {
    plugin = name;
    name = plugin.name;
  } else if (typeof plugin === 'function') {
    plugin = { name, load: plugin };
  }
  if (!name || !plugin || typeof plugin.load !== 'function') {
    throw new Error('Dataset plugin requires a name and load function.');
  }
  if (plugin.defaultMetrics && !Array.isArray(plugin.defaultMetrics)) {
    throw new Error(`Dataset plugin "${name}" defaultMetrics must be an array.`);
  }
  datasets.set(name, { ...plugin, name });
}

function getDataset(name) {
  const plugin = datasets.get(name);
  if (!plugin) throw new Error(`Unknown dataset "${name}". Available: ${[...datasets.keys()].join(', ')}`);
  return plugin;
}

function loadDataset(name, paths) {
  return getDataset(name).load(paths?.length ? paths : undefined);
}

function readCsv(path) {
  return parse(readFileSync(path, 'utf8'), { bom: true, columns: true, skip_empty_lines: true });
}

module.exports = { getDataset, loadDataset, readCsv, registerDataset };
