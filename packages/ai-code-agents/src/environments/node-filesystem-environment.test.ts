import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NodeFilesystemEnvironment } from './node-filesystem-environment';

/**
 * Creates a temporary test environment for NodeFilesystemEnvironment tests.
 *
 * @returns An object containing the environment and the temporary directory path.
 */
async function createTestEnvironment(): Promise<{
  env: NodeFilesystemEnvironment;
  tempDir: string;
}> {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'node-filesystem-env-test-'),
  );

  // Create some initial files
  await fs.writeFile(
    path.join(tempDir, 'existing-file.txt'),
    'Hello, World!',
    'utf-8',
  );
  await fs.writeFile(
    path.join(tempDir, 'another-file.txt'),
    'Some content',
    'utf-8',
  );

  const env = new NodeFilesystemEnvironment({
    directoryPath: tempDir,
  });

  return { env, tempDir };
}

/**
 * Cleans up the temporary directory.
 *
 * @param tempDir - The temporary directory path to remove.
 */
async function cleanupTestEnvironment(tempDir: string): Promise<void> {
  await fs.rm(tempDir, { recursive: true, force: true });
}

describe('NodeFilesystemEnvironment', () => {
  let testEnv: { env: NodeFilesystemEnvironment; tempDir: string };

  beforeEach(async () => {
    testEnv = await createTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testEnv.tempDir);
  });

  describe('constructor', () => {
    it('should create an environment with a valid directory path', () => {
      const env = new NodeFilesystemEnvironment({
        directoryPath: '/tmp',
      });
      expect(env.name).toBe('node-filesystem');
    });

    it('should throw an error when directoryPath is not provided', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Testing invalid config
      expect(() => new NodeFilesystemEnvironment({})).toThrow(
        'The directory path must be provided',
      );
    });

    it('should throw an error when directoryPath is empty', () => {
      expect(
        () => new NodeFilesystemEnvironment({ directoryPath: '' }),
      ).toThrow('The directory path must be provided');
    });
  });

  describe('readFile', () => {
    it('should read an existing file', async () => {
      const result = await testEnv.env.readFile('existing-file.txt');
      expect(result.path).toBe('existing-file.txt');
      expect(result.content).toBe('Hello, World!');
    });

    it('should throw an error for a non-existent file', async () => {
      await expect(
        testEnv.env.readFile('non-existent-file.txt'),
      ).rejects.toThrow('File not found: non-existent-file.txt');
    });

    it('should throw an error for an invalid path', async () => {
      await expect(testEnv.env.readFile('../invalid-path.txt')).rejects.toThrow(
        'Path traversal is not allowed.',
      );
    });
  });

  describe('writeFile', () => {
    it('should write a new file', async () => {
      const result = await testEnv.env.writeFile('new-file.txt', 'New content');
      expect(result.path).toBe('new-file.txt');
      expect(result.message).toBe('File written successfully.');

      const fileContent = await testEnv.env.readFile('new-file.txt');
      expect(fileContent.content).toBe('New content');

      // Verify it was actually written to the filesystem
      const actualContent = await fs.readFile(
        path.join(testEnv.tempDir, 'new-file.txt'),
        'utf-8',
      );
      expect(actualContent).toBe('New content');
    });

    it('should overwrite an existing file', async () => {
      const result = await testEnv.env.writeFile(
        'existing-file.txt',
        'Overwritten content',
      );
      expect(result.path).toBe('existing-file.txt');
      expect(result.message).toBe('File written successfully.');

      const fileContent = await testEnv.env.readFile('existing-file.txt');
      expect(fileContent.content).toBe('Overwritten content');
    });
  });

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      const result = await testEnv.env.deleteFile('existing-file.txt');
      expect(result.path).toBe('existing-file.txt');
      expect(result.message).toBe('File deleted successfully.');

      await expect(testEnv.env.readFile('existing-file.txt')).rejects.toThrow(
        'File not found: existing-file.txt',
      );

      // Verify it was actually deleted from the filesystem
      await expect(
        fs.access(path.join(testEnv.tempDir, 'existing-file.txt')),
      ).rejects.toThrow();
    });

    it('should return a message for a non-existent file', async () => {
      const result = await testEnv.env.deleteFile('non-existent-file.txt');
      expect(result.path).toBe('non-existent-file.txt');
      expect(result.message).toBe('File was already deleted.');
    });
  });

  describe('moveFile', () => {
    it('should move a file to a new location', async () => {
      const result = await testEnv.env.moveFile(
        'existing-file.txt',
        'new-location.txt',
      );
      expect(result.sourcePath).toBe('existing-file.txt');
      expect(result.destinationPath).toBe('new-location.txt');
      expect(result.message).toBe('File moved successfully.');

      await expect(testEnv.env.readFile('existing-file.txt')).rejects.toThrow(
        'File not found: existing-file.txt',
      );

      const newFileContent = await testEnv.env.readFile('new-location.txt');
      expect(newFileContent.content).toBe('Hello, World!');
    });

    it('should overwrite a file at the destination', async () => {
      const result = await testEnv.env.moveFile(
        'existing-file.txt',
        'another-file.txt',
      );
      expect(result.sourcePath).toBe('existing-file.txt');
      expect(result.destinationPath).toBe('another-file.txt');
      expect(result.message).toBe('File moved successfully.');

      await expect(testEnv.env.readFile('existing-file.txt')).rejects.toThrow(
        'File not found: existing-file.txt',
      );

      const newFileContent = await testEnv.env.readFile('another-file.txt');
      expect(newFileContent.content).toBe('Hello, World!');
    });

    it('should throw an error for a non-existent source file', async () => {
      await expect(
        testEnv.env.moveFile('non-existent-file.txt', 'new-location.txt'),
      ).rejects.toThrow('File not found: non-existent-file.txt');
    });
  });

  describe('copyFile', () => {
    it('should copy a file to a new location', async () => {
      const result = await testEnv.env.copyFile(
        'existing-file.txt',
        'new-location.txt',
      );
      expect(result.sourcePath).toBe('existing-file.txt');
      expect(result.destinationPath).toBe('new-location.txt');
      expect(result.message).toBe('File copied successfully.');

      const oldFileContent = await testEnv.env.readFile('existing-file.txt');
      expect(oldFileContent.content).toBe('Hello, World!');

      const newFileContent = await testEnv.env.readFile('new-location.txt');
      expect(newFileContent.content).toBe('Hello, World!');
    });

    it('should overwrite a file at the destination', async () => {
      const result = await testEnv.env.copyFile(
        'existing-file.txt',
        'another-file.txt',
      );
      expect(result.sourcePath).toBe('existing-file.txt');
      expect(result.destinationPath).toBe('another-file.txt');
      expect(result.message).toBe('File copied successfully.');

      const oldFileContent = await testEnv.env.readFile('existing-file.txt');
      expect(oldFileContent.content).toBe('Hello, World!');

      const newFileContent = await testEnv.env.readFile('another-file.txt');
      expect(newFileContent.content).toBe('Hello, World!');
    });

    it('should throw an error for a non-existent source file', async () => {
      await expect(
        testEnv.env.copyFile('non-existent-file.txt', 'new-location.txt'),
      ).rejects.toThrow('File not found: non-existent-file.txt');
    });
  });
});
