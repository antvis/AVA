import { z } from 'zod';

import { text } from './shared';

export const textSourceSchema = z.object({ type: z.literal('text'), options: z.object({ text }).strict() }).strict();

export type TextSourceOptions = z.input<typeof textSourceSchema>['options'];
