import { z } from 'zod';

/** Parse a bounded, inclusive A1 rectangle shared by both engines. */
export function excelRange(range: string) {
  const match = /^([A-Z]{1,3})([1-9]\d*):([A-Z]{1,3})([1-9]\d*)$/i.exec(range);
  if (!match) throw new Error('Excel range must be an A1 rectangle such as B3:F100');
  const [, firstColumn, firstRow, lastColumn, lastRow] = match;
  const column = (name: string) => [...name.toUpperCase()].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
  if (
    column(firstColumn) > column(lastColumn) ||
    column(lastColumn) > 16384 ||
    Number(firstRow) > Number(lastRow) ||
    Number(lastRow) > 1048576
  ) {
    throw new Error('Excel range is reversed or outside worksheet bounds');
  }
  return {
    firstColumn: firstColumn.toUpperCase(),
    lastColumn: lastColumn.toUpperCase(),
    firstRow: Number(firstRow),
    lastRow: Number(lastRow),
  };
}

const excelSheetSchema = z
  .object({
    name: z.string().min(1),
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
  })
  .strict();

export const excelOptionsSchema = z
  .object({
    path: z.string().min(1),
    headers: z.record(z.string()).optional(),
    sheets: z
      .array(excelSheetSchema)
      .nonempty()
      .refine(
        (sheets) => new Set(sheets.map((sheet) => sheet.name)).size === sheets.length,
        'Excel sheet names must be unique'
      )
      .optional(),
  })
  .strict();
