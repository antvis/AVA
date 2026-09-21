const { readdirSync, statSync } = require('node:fs');
const { dirname, extname, join, resolve } = require('node:path');

const { readCsv } = require('../_shared/datasets');

function csvFiles(paths) {
  return paths.flatMap((input) => {
    const path = resolve(input);
    return statSync(path).isDirectory()
      ? csvFiles(readdirSync(path).map((entry) => join(path, entry)))
      : extname(path).toLowerCase() === '.csv'
        ? [path]
        : [];
  }).sort();
}

function load(name, directory, paths = [join(__dirname, 'datasets', directory, 'questions.csv')]) {
  return csvFiles(paths).flatMap((path) =>
    readCsv(path).map((row, index) => {
      const id = String(row.id ?? index);
      const suite = String(row.dataset ?? 'unknown');
      const question = String(row.question ?? '');
      const answerType = String(row.type ?? '');
      const dataPath = resolve(dirname(path), String(row.data_path ?? ''));
      if (!question || !answerType || !row.data_path) {
        throw new Error(`${path}: row ${index + 2} requires question, type, and data_path.`);
      }
      return {
        id: `${name}:${id}`,
        dataset: name,
        suite,
        questionId: id,
        question,
        answerType,
        goldAnswer: String(row.answer ?? ''),
        dataPath,
        source: path,
      };
    }),
  );
}

function stripAnswer(value) {
  return String(value ?? '').replace(/^[\[\]'" ]+|[\[\]'" ]+$/g, '');
}

function numberValue(value) {
  const number = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) ? Math.trunc(number * 100) : null;
}

function listValues(value) {
  return String(value).replace(/^\[|\]$/g, '').split(',').map(stripAnswer);
}

function sameSet(left, right) {
  return left.length === right.length && new Set(left).size === new Set(right).size && left.every((item) => right.includes(item));
}

function dateValue(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function sameCategories(left, right) {
  if (sameSet(left, right)) return true;
  const leftDates = left.map(dateValue);
  const rightDates = right.map(dateValue);
  return !leftDates.includes(null) && !rightDates.includes(null) && sameSet(leftDates, rightDates);
}

function databenchAnswer(prediction, sample) {
  const left = stripAnswer(prediction);
  const right = stripAnswer(sample.goldAnswer);
  const nulls = new Set(['', 'nan', 'np.nan', 'None']);
  if (nulls.has(left) || nulls.has(right)) return nulls.has(left) && nulls.has(right);

  if (sample.answerType === 'boolean') {
    const trueValues = new Set(['true', 'yes', 'y']);
    const falseValues = new Set(['false', 'no', 'n']);
    return (
      (trueValues.has(left.toLowerCase()) && trueValues.has(right.toLowerCase())) ||
      (falseValues.has(left.toLowerCase()) && falseValues.has(right.toLowerCase()))
    );
  }
  if (sample.answerType === 'number') return numberValue(left) === numberValue(right) && numberValue(left) !== null;
  if (sample.answerType === 'category') {
    if (left === right) return true;
    return dateValue(left) !== null && dateValue(left) === dateValue(right);
  }
  if (sample.answerType === 'list[category]') return sameCategories(listValues(left), listValues(right));
  if (sample.answerType === 'list[number]') {
    const leftNumbers = listValues(left).map(numberValue);
    const rightNumbers = listValues(right).map(numberValue);
    return !leftNumbers.includes(null) && !rightNumbers.includes(null) && sameSet(leftNumbers, rightNumbers);
  }
  throw new Error(`Unsupported DataBench answer type: ${sample.answerType}`);
}

const plugins = [
  ['databench-lite', 'lite'],
  ['databench', 'full'],
].map(([name, directory]) => ({
  name,
  defaultMetrics: ['databench-answer'],
  metrics: { 'databench-answer': databenchAnswer },
  load: (paths) => load(name, directory, paths),
}));

module.exports = { databenchAnswer, plugins };
