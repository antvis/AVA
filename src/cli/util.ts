function colorsEnabled(isTTY: boolean | undefined): boolean {
  return Boolean(isTTY && !('NO_COLOR' in process.env));
}

function ansi(code: string, value: string): string {
  return `\u001B[${code}m${value}\u001B[0m`;
}

export const bold = (value: string, color = colorsEnabled(process.stdout.isTTY)) => (color ? ansi('1', value) : value);
export const accent = (value: string, color = colorsEnabled(process.stdout.isTTY)) =>
  color ? ansi('1;36', value) : value;
export const muted = (value: string, color = colorsEnabled(process.stdout.isTTY)) => (color ? ansi('2', value) : value);
export const badge = (value: string, color = colorsEnabled(process.stdout.isTTY)) => {
  const label = ` ${value} `;
  return color ? ansi('1;30;46', label) : label;
};
const danger = (value: string, color = colorsEnabled(process.stderr.isTTY)) => (color ? ansi('1;31', value) : value);

/**
 * Formats CLI errors for terminals without affecting machine-readable output.
 */
export function formatError(error: unknown, color = colorsEnabled(process.stderr.isTTY)): string {
  const message = error instanceof Error ? error.message : String(error);
  const label = danger('Error:', color);
  return `${label} ${message}`;
}
