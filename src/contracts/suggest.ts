import { z } from 'zod';

export const suggestInputSchema = z.number();
const suggestionSchema = z.object({ query: z.string(), score: z.number().min(0).max(1), reason: z.string() });
export const suggestOutputSchema = z.array(suggestionSchema);

export type SuggestInput = z.input<typeof suggestInputSchema>;
export type SuggestOutput = z.output<typeof suggestOutputSchema>;
export type SuggestResult = SuggestOutput[number];
