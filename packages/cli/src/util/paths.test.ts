import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { normalizeAbsolutePath } from './paths';

describe('normalizeAbsolutePath', () => {
  it('should return the same path if it is already absolute', () => {
    const absolutePath = path.resolve('/test/path');
    expect(normalizeAbsolutePath(absolutePath)).toBe(absolutePath);
  });

  it('should return an absolute path based on process.cwd() if no rootDir is provided', () => {
    const relativePath = 'test/path';
    const expectedPath = path.join(process.cwd(), relativePath);
    expect(normalizeAbsolutePath(relativePath)).toBe(expectedPath);
  });

  it('should return an absolute path based on the provided rootDir', () => {
    const relativePath = 'test/path';
    const rootDir = '/custom/root';
    const expectedPath = path.join(rootDir, relativePath);
    expect(normalizeAbsolutePath(relativePath, rootDir)).toBe(expectedPath);
  });

  it('should handle an empty string as a relative path', () => {
    const relativePath = '';
    const expectedPath = process.cwd();
    expect(normalizeAbsolutePath(relativePath)).toBe(expectedPath);
  });

  it('should handle an empty string as a relative path with a rootDir', () => {
    const relativePath = '';
    const rootDir = '/custom/root';
    const expectedPath = rootDir;
    expect(normalizeAbsolutePath(relativePath, rootDir)).toBe(expectedPath);
  });

  it('should handle "." as a relative path', () => {
    const relativePath = '.';
    const expectedPath = process.cwd();
    expect(normalizeAbsolutePath(relativePath)).toBe(expectedPath);
  });

  it('should handle "." as a relative path with a rootDir', () => {
    const relativePath = '.';
    const rootDir = '/custom/root';
    const expectedPath = rootDir;
    expect(normalizeAbsolutePath(relativePath, rootDir)).toBe(expectedPath);
  });

  it('should handle ".." as a relative path', () => {
    const relativePath = '..';
    const expectedPath = path.dirname(process.cwd());
    expect(normalizeAbsolutePath(relativePath)).toBe(expectedPath);
  });

  it('should handle ".." as a relative path with a rootDir', () => {
    const relativePath = '..';
    const rootDir = '/custom/root/dir';
    const expectedPath = path.dirname(rootDir);
    expect(normalizeAbsolutePath(relativePath, rootDir)).toBe(expectedPath);
  });
});
