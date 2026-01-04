import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

import { readLocalDirectoryFiles } from './read-local-directory-files';

describe('readLocalDirectoryFiles', () => {
  it('should return empty object when no files are found', async () => {
    const tempDir = await fs.mkdtemp(path.join('/tmp', 'test-'));

    try {
      const result = await readLocalDirectoryFiles(tempDir);
      expect(result).toEqual({});
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should return file contents when files exist', async () => {
    const tempDir = await fs.mkdtemp(path.join('/tmp', 'test-'));

    try {
      await fs.writeFile(path.join(tempDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(tempDir, 'file2.txt'), 'content2');

      const result = await readLocalDirectoryFiles(tempDir);

      expect(result).toEqual({
        'file1.txt': 'content1',
        'file2.txt': 'content2',
      });
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle single file', async () => {
    const tempDir = await fs.mkdtemp(path.join('/tmp', 'test-'));

    try {
      await fs.writeFile(path.join(tempDir, 'single.txt'), 'single content');

      const result = await readLocalDirectoryFiles(tempDir);

      expect(result).toEqual({
        'single.txt': 'single content',
      });
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle files with empty content', async () => {
    const tempDir = await fs.mkdtemp(path.join('/tmp', 'test-'));

    try {
      await fs.writeFile(path.join(tempDir, 'empty.txt'), '');

      const result = await readLocalDirectoryFiles(tempDir);

      expect(result).toEqual({
        'empty.txt': '',
      });
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should exclude gitignored files', async () => {
    const tempDir = await fs.mkdtemp(path.join('/tmp', 'test-'));

    try {
      await fs.writeFile(path.join(tempDir, 'normal.txt'), 'normal');
      await fs.writeFile(path.join(tempDir, 'ignored.txt'), 'ignored');
      await fs.writeFile(path.join(tempDir, '.gitignore'), 'ignored.txt\n');

      const result = await readLocalDirectoryFiles(tempDir);

      expect(result).toEqual({
        'normal.txt': 'normal',
        '.gitignore': 'ignored.txt\n',
      });
      expect(result).not.toHaveProperty('ignored.txt');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
