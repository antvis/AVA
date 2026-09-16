/**
 * Code engine: in-memory data loading + LLM-generated JavaScript analysis.
 * Works in both Node.js and browser.
 */
export { CodeEngine, executeDataCode, generateDataCode } from './engine';
export { loadCSV, loadObject, loadURL, loadText } from './loaders';
export { extractMetadata, formatDatasetInfo, formatDatasetInfoWithNonArray } from './metadata';
