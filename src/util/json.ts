import { jsonrepair } from 'jsonrepair';

/** Keep unrepairable input intact so the caller can report its parsing error. */
export function repairJson(text: string): string {
  try {
    return jsonrepair(text);
  } catch {
    return text;
  }
}
