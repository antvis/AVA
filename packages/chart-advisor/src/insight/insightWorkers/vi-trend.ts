import { Insight as VisualInsight } from 'visual-insights';
import { visualInsightWorkerToAVAWorker } from './utils';
import { Worker } from '.';

export const trendIW: Worker = visualInsightWorkerToAVAWorker(VisualInsight.DefaultIWorker.trend);
