import { z } from 'zod';

import { database } from './shared';

export const mysqlSourceSchema = z.object({ type: z.literal('mysql'), options: database }).strict();

export type MySQLSourceOptions = z.input<typeof mysqlSourceSchema>['options'];
