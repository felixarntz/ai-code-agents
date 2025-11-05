import { describe, it, expect } from 'vitest';
import { globToRegExp } from './glob-to-reg-exp';

describe('globToRegExp', () => {
  it('should handle a simple file name', () => {
    const re = globToRegExp('file.txt');
    expect(re.test('file.txt')).toBe(true);
    expect(re.test('other.txt')).toBe(false);
  });

  it('should handle a single wildcard without extension (*)', () => {
    const re = globToRegExp('*');
    expect(re.test('file')).toBe(true);
    expect(re.test('anotherFile')).toBe(true);
    expect(re.test('file.txt')).toBe(true);
    expect(re.test('dir/file.txt')).toBe(false);
  });

  it('should handle a single wildcard with extension (*)', () => {
    const re = globToRegExp('*.txt');
    expect(re.test('file.txt')).toBe(true);
    expect(re.test('another.txt')).toBe(true);
    expect(re.test('file.md')).toBe(false);
    expect(re.test('dir/file.txt')).toBe(false);
  });

  it('should handle a double wildcard (**)', () => {
    const re = globToRegExp('**/*.txt');
    expect(re.test('file.txt')).toBe(true);
    expect(re.test('dir/file.txt')).toBe(true);
    expect(re.test('dir/subdir/file.txt')).toBe(true);
    expect(re.test('file.md')).toBe(false);
  });

  it('should handle a question mark wildcard (?)', () => {
    const re = globToRegExp('file?.txt');
    expect(re.test('file1.txt')).toBe(true);
    expect(re.test('fileA.txt')).toBe(true);
    expect(re.test('file.txt')).toBe(false);
    expect(re.test('file12.txt')).toBe(false);
  });

  it('should handle a mix of wildcards', () => {
    const re = globToRegExp('src/**/?.ts');
    expect(re.test('src/index.ts')).toBe(false);
    expect(re.test('src/a.ts')).toBe(true);
    expect(re.test('src/components/b.ts')).toBe(true);
    expect(re.test('src/components/index.ts')).toBe(false);
  });

  it('should handle multiple single wildcards', () => {
    const re = globToRegExp('src/*/*/file.ts');
    expect(re.test('src/foo/bar/index.ts')).toBe(false);
    expect(re.test('src/foo/bar/file.ts')).toBe(true);
    expect(re.test('src/bar/foo/file.ts')).toBe(true);
    expect(re.test('src/foo/bar/baz/file.ts')).toBe(false);
    expect(re.test('src/foo/file.ts')).toBe(false);
  });

  it('should handle a double wildcard with directory after', () => {
    const re = globToRegExp('src/**/bar/file.ts');
    expect(re.test('src/foo/bar/index.ts')).toBe(false);
    expect(re.test('src/foo/bar/file.ts')).toBe(true);
    expect(re.test('src/bar/file.ts')).toBe(true);
    expect(re.test('src/foo/foo/file.ts')).toBe(false);
    expect(re.test('src/foo/baz/bar/file.ts')).toBe(true);
    expect(re.test('src/foo/bar/baz/file.ts')).toBe(false);
    expect(re.test('src/foo/file.ts')).toBe(false);
  });

  it('should escape special regex characters', () => {
    const re = globToRegExp('file(1).txt');
    expect(re.test('file(1).txt')).toBe(true);
    expect(re.test('file1.txt')).toBe(false);
  });

  it('should support relative paths', () => {
    const re = globToRegExp('./src/*.ts');
    expect(re.test('./src/index.ts')).toBe(true);
    expect(re.test('src/index.ts')).toBe(false);
    expect(re.test('./src/utils/helper.ts')).toBe(false);
  });
});
