import { z } from 'zod';

import { dataModelStructure, modelStructure, column, withModelSource } from './shared/data-model';

export const semanticInputSchema = z.record(z.string(), z.never());
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
