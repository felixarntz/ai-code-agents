/**
 * Escapes a command string to be safely passed as a single argument to `sh -c`.
 *
 * This function properly escapes backslashes and double quotes in the command
 * string, then wraps the entire command in double quotes. This ensures that
 * the command string is treated as a single argument and shell metacharacters
 * are not interpreted prematurely.
 *
 * @param command - The command string to escape.
 * @returns The escaped command string wrapped in double quotes.
 */
export function escapeCommand(command: string): string {
  // First escape backslashes, then double quotes
  const escaped = command.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}
