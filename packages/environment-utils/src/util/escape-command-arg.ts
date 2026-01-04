/**
 * Escapes a string to be used as a single command-line argument in a POSIX-compliant shell.
 *
 * The string is wrapped in single quotes, and any existing single quotes are
 * safely escaped. This prevents the shell from interpreting special
 * characters or expanding variables.
 *
 * @param arg - The argument string to escape.
 * @returns The escaped and quoted argument string.
 */
export function escapeCommandArg(arg: string): string {
  if ('' === arg) {
    return "''";
  }
  // 1. Replace all single quotes with '\''
  // 2. Wrap the entire string in single quotes.
  //    e.g., "it's a test" -> "'it'\\''s a test'"
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
