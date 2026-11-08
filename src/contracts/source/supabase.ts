import { z } from 'zod';

import { text } from './shared';

export const supabaseSourceSchema = z
  .object({ type: z.literal('supabase'), options: z.object({ accessToken: text, projectRef: text }).strict() })
  .strict();

export type SupabaseSourceOptions = z.input<typeof supabaseSourceSchema>['options'];
