import _ from 'lodash';
import fs from 'fs';
import path from 'path';

const dirname = path.dirname(__filename);

const DIR_PATH = path.resolve(dirname, './datasets');

export const loadDataset = () => {
  const datasets = [];
  const dirs = fs.readdirSync(DIR_PATH);
  _.each(dirs, (filename) => {
    const jsonString = fs.readFileSync(path.resolve(DIR_PATH, filename), 'utf-8');
    try {
      datasets.push(JSON.parse(jsonString));
    } catch (e) {
      console.error(e);
    }
  });
  console.debug(`load datasets complete, count: ${datasets.length}`);
  return datasets;
};
