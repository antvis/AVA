import { z } from 'zod';

import { tencentDocsOptionsSchema } from '../../duckdb/loaders/tencent/config';

export const tencentDocsSourceSchema = z
  .object({ type: z.literal('tencent-smartsheet'), options: tencentDocsOptionsSchema })
  .strict();
