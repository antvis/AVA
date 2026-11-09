/**
 * JSON file loader: read a JSON file (local path or http(s) URL) through
 * DuckDB's json reader. Distinct from the inline `json` loader (json.ts),
 * which takes an in-memory object array.
 */

import { createFileLoader } from '../util/file';

import type { JsonFileSourceOptions } from '../../types';

export const loadJSONFile = createFileLoader<JsonFileSourceOptions>('json');
