/**
 * Converts a glob pattern to a regular expression.
 *
 * This is a best-effort implementation and may not cover all edge cases of
 * glob patterns. It supports `*`, `**`, and `?`.
 *
 * @param glob - The glob pattern to convert.
 * @returns A regular expression that matches the glob pattern.
 */
export function globToRegExp(glob: string): RegExp {
  let reStr = '';
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    switch (char) {
      case '*':
        if (glob[i + 1] === '*') {
          // Handle '**/' pattern
          if (glob[i + 2] === '/') {
            reStr += '(?:.*\\/)?';
            i += 2; // Consume '**/'
          } else {
            reStr += '.*';
            i++; // Consume the second '*'
          }
        } else {
          reStr += '[^/]*';
        }
        break;
      case '?':
        reStr += '[^/]';
        break;
      // Escape characters with special meaning in regex.
      case '.':
      case '(':
      case ')':
      case '[':
      case ']':
      case '{':
      case '}':
      case '+':
      case '^':
      case '$':
      case '|':
      case '\\':
        reStr += `\\${char}`;
        break;
      default:
        reStr += char;
    }
  }
  return new RegExp(`^${reStr}$`);
}
