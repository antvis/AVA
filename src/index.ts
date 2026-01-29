/**
 * AVA v4 - A framework for AI-native Visual Analytics
 * 
 * Main entry point
 */

export { AVA } from './ava';
export type { AVAConfig, LLMConfig, AnalysisResponse, DatasetInfo, FieldMetadata } from './types';

// Re-export modules for advanced usage
export * from './data';
export * from './analysis';
