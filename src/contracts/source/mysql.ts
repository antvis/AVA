import { z } from 'zod';

import { database } from './shared';

export const mysqlSourceSchema = z.object({ type: z.literal('mysql'), options: database }).strict();
