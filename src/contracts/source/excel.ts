import { z } from 'zod';

import { excelRange } from '../../util/excel';

export const excelSheetSchema = z
  .object({
    sheet: z.string().min(1),
    range: z
      .string()
      .refine((value) => {
        try {
          excelRange(value);
          return true;
        } catch {
          return false;
        }
      }, 'Invalid Excel A1 range')
      .transform((value) => value.toUpperCase())
      .optional(),
    header: z.boolean().default(true),
    all_varchar: z.boolean().optional(),
    ignore_errors: z.boolean().optional(),
    stop_at_empty: z.boolean().optional(),
    empty_as_varchar: z.boolean().optional(),
  })
  .strict();

export const excelOptionsSchema = z
  .object({
    path: z.string().min(1),
    headers: z.record(z.string(), z.string()).optional(),
    sheets: z
      .array(excelSheetSchema)
      .nonempty()
      .refine(
        (sheets) => new Set(sheets.map((sheet) => sheet.sheet)).size === sheets.length,
        'Excel sheet names must be unique'
      )
      .optional(),
  })
  .strict();

export const excelSourceSchema = z.object({ type: z.literal('excel'), options: excelOptionsSchema }).strict();
