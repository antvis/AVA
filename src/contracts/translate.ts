import { z } from 'zod';

export const translateInputSchema = z.string();
export const translateOutputSchema = z.string();

export type TranslateInput = z.input<typeof translateInputSchema>;
export type TranslateOutput = z.output<typeof translateOutputSchema>;
