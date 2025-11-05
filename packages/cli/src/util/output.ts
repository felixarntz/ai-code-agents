/**
 * Prints command output.
 *
 * @param text - The text to print.
 */
export function output(text: string): void {
  process.stdout.write(`${text}\n`);
}

/**
 * Prints command output without "terminating" the line.
 *
 * @param text - The text to print.
 */
export function outputPartial(text: string): void {
  process.stdout.write(text);
}
