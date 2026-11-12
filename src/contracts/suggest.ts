import { z } from 'zod';

export const suggestInputSchema = z.number();
export const suggestOutputSchema = z.array(
  z.object({ query: z.string(), score: z.number().min(0).max(1), reason: z.string() })
);
