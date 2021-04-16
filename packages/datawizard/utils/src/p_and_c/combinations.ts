import { JSONData } from '../data_structure';

export function isFullCombination(data: JSONData): boolean {
  // Empty dataset is not full-combination by definition.
  if (!data || data.length === 0) return false;

  // One record dataset is full-combination by definition.
  if (data.length === 1) return true;

  const fieldNames = Object.keys(data[0]);

  const OptionalValuesOfFields: Record<string, Set<string>> = {};
  fieldNames.forEach((fieldName) => {
    OptionalValuesOfFields[fieldName] = new Set();
  });

  const recordStrUUIDs = new Set();

  data.forEach((row) => {
    const keys = Object.keys(row);

    keys.forEach((key) => {
      OptionalValuesOfFields[key].add(row[key]);
    });

    const vStr = JSON.stringify(
      keys.sort().map((key) => {
        return { [key]: row[key] };
      })
    );

    recordStrUUIDs.add(vStr);
  });

  // If records have repetition, fail by definition.
  if (recordStrUUIDs.size !== data.length) return false;

  const fullCombSize = Object.values(OptionalValuesOfFields)
    .map((set) => set.size)
    .reduce((acc, cur) => acc * cur);

  // Succeed only if full-combination size equals to the size of dataset.
  if (fullCombSize === data.length) return true;

  return false;
}
