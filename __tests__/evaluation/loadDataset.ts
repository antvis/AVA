import _ from 'lodash';
import fs from 'fs';
import path from 'path';

const dirname = path.dirname(__filename);

const DIR_PATH = path.resolve(dirname, './datasets');

export const loadDataset = (dirname: string) => {
  if (!dirname) return [];
  const testJsonPath = path.resolve(DIR_PATH, dirname, 'test.json');
  try {
    const jsonString = fs.readFileSync(testJsonPath, 'utf-8');
    return JSON.parse(jsonString);
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const loadAllData = (exclueds?: string[]) => {
  const dirs = fs.readdirSync(DIR_PATH);
  const includes = exclueds
    ? _.filter(dirs, (dirname) => {
        return !exclueds?.includes(dirname);
      })
    : dirs;
  return _.map(includes, (dirname) => {
    return {
      key: dirname,
      data: loadDataset(dirname),
    };
  });
};
