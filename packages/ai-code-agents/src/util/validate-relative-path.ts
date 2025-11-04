import * as path from 'node:path';

/**
 * Validates that the given path is a relative path and does not contain path traversal.
 *
 * @param filePath - The file path to validate.
 */
export function validateRelativePath(filePath: string): void {
  if (path.isAbsolute(filePath)) {
    throw new Error('Absolute paths are not allowed.');
  }
  if (filePath.startsWith('~')) {
    throw new Error('Paths starting with "~" are not allowed.');
  }
  if (filePath.includes('\0')) {
    throw new Error('Paths must not contain null bytes.');
  }

  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.startsWith('..')) {
    throw new Error('Path traversal is not allowed.');
  }
}
