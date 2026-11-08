import { z } from 'zod';

import { dataModelStructure, modelStructure, column, withModelSource } from './shared/data-model';

export const semanticInputSchema = z.record(z.string(), z.never());
/** Semantic definitions exclude model and column profiling metrics. */
export const semanticOutputSchema = dataModelStructure.extend({
  models: z
    .array(
      withModelSource(
        modelStructure.omit({ metrics: true }).extend({ columns: z.array(column.omit({ metrics: true })).optional() })
      )
    )
    .optional(),
});
export const semanticMetadataSchema = semanticOutputSchema;

/** Options only; SDK setter callbacks are not part of the data contract. */
export type SemanticInput = z.input<typeof semanticInputSchema>;
export type SemanticOutput = z.output<typeof semanticOutputSchema>;
export type SemanticOptions = SemanticInput;
/** Business definitions supplied independently of catalog discovery and profiling observations. */
export type Semantic = SemanticOutput;
