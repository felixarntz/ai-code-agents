import { describe, it, expect } from 'vitest';
import { validateRelativePath } from './validate-relative-path';

describe('validateRelativePath', () => {
  it('should not throw an error for a valid relative path', () => {
    expect(() => validateRelativePath('foo/bar')).not.toThrow();
  });

  it('should not throw an error for a single file name', () => {
    expect(() => validateRelativePath('foo.txt')).not.toThrow();
  });

  it('should not throw an error for a path with non-leading "../"', () => {
    expect(() => validateRelativePath('foo/bar/../baz')).not.toThrow();
  });

  it('should throw an error for an absolute path', () => {
    expect(() => validateRelativePath('/foo/bar')).toThrow(
      'Absolute paths are not allowed.',
    );
  });

  it('should throw an error for a path starting with "~"', () => {
    expect(() => validateRelativePath('~/foo/bar')).toThrow(
      'Paths starting with "~" are not allowed.',
    );
  });

  it('should throw an error for a path containing a null byte', () => {
    expect(() => validateRelativePath('foo\0bar')).toThrow(
      'Paths must not contain null bytes.',
    );
  });

  it('should throw an error for a path starting with "../"', () => {
    expect(() => validateRelativePath('../foo/bar')).toThrow(
      'Path traversal is not allowed.',
    );
  });

  it('should throw an error for a path that resolves to a parent directory', () => {
    expect(() => validateRelativePath('foo/../../bar')).toThrow(
      'Path traversal is not allowed.',
    );
  });
});
