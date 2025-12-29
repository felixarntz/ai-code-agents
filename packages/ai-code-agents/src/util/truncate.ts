/**
 * Truncates a string based on line count or character limit.
 *
 * For multiline strings (ignoring final blank lines), limits to 5 lines and appends "(x more lines)".
 * For single-line strings, limits to 300 characters and appends "(x more characters)".
 *
 * @param str - The string to truncate.
 * @returns The truncated string with appropriate suffix if truncation occurred.
 */
export function truncateString(str: string): string {
  // Split into lines and remove trailing blank lines
  const lines = str.split('\n');
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  const isMultiline = lines.length > 1;

  if (isMultiline) {
    // Multiline: limit to 5 lines
    if (lines.length > 5) {
      const truncatedLines = lines.slice(0, 5).join('\n');
      const moreLines = lines.length - 5;
      const lineSuffix = moreLines === 1 ? 'line' : 'lines';
      return `${truncatedLines}\n...(${moreLines} more ${lineSuffix})`;
    }
    return lines.join('\n');
  }

  // Single-line: limit to 300 characters
  const singleLine = lines[0] || '';
  if (singleLine.length > 300) {
    const moreChars = singleLine.length - 300;
    return `${singleLine.slice(0, 300)}...(${moreChars} more characters)`;
  }

  return singleLine;
}

/**
 * Recursively truncates all string values in an object using truncateString.
 *
 * Handles nested objects and arrays by recursively processing their elements.
 * For objects, iterates through all key-value pairs. For arrays, processes each element.
 *
 * @param obj - The object to truncate.
 * @returns A new object with all strings truncated.
 */
export function truncateObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = truncateString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (typeof item === 'string') {
          return truncateString(item);
        }
        if (typeof item === 'object' && item !== null) {
          return truncateObject(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      result[key] = truncateObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}
