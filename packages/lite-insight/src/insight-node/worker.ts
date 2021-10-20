import { expose } from 'threads/worker';
import { extractInsights } from '../pipeline/insight';

expose({
  extractInsights,
});
