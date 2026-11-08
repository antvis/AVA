import { z } from 'zod';

import { file } from './shared';

export const parquetSourceSchema = z.object({ type: z.literal('parquet'), options: file }).strict();

export type ParquetSourceOptions = z.input<typeof parquetSourceSchema>['options'];
