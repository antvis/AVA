import { z } from 'zod';

import { dataModelStructure, modelStructure, column, hasSingleSource, modelSourceMessage } from './shared/data-model';

import type { DataModel, Model, ModelSource, Column } from './shared/data-model';

/** Semantic definitions exclude model and column profiling metrics. */
export const semanticMetadataSchema = dataModelStructure.extend({
  models: z
    .array(
      modelStructure
        .omit({ metrics: true })
        .extend({ columns: z.array(column.omit({ metrics: true })).optional() })
        .refine(hasSingleSource, modelSourceMessage)
    )
    .optional(),
}) as unknown as z.ZodType<Semantic>;

/** Semantic metadata currently has no configurable options. */
export type SemanticOptions = Record<string, never>;

/** Business definitions supplied independently of catalog discovery and profiling observations. */
export interface Semantic extends Pick<DataModel, 'description' | 'properties' | 'relationships' | 'views' | 'cubes'> {
  models?: (Omit<Model, 'columns' | 'metrics'> &
    ModelSource & {
      columns?: Omit<Column, 'metrics'>[];
    })[];
}
