import { describe, it, expect } from 'vitest';
import { MockFilesystemEnvironment } from './mock-filesystem-environment';

/**
 * Creates a default test environment for MockFilesystemEnvironment tests.
 *
 * @returns A new MockFilesystemEnvironment instance with default initial files.
 */
function createDefaultTestEnvironment(): MockFilesystemEnvironment {
  return new MockFilesystemEnvironment({
    initialFiles: new Map([
      ['existing-file.txt', 'Hello, World!'],
      ['another-file.txt', 'Some content'],
    ]),
  });
}

describe('MockFilesystemEnvironment', () => {
  describe('readFile', () => {
    it('should read an existing file', async () => {
      const result =
        await createDefaultTestEnvironment().readFile('existing-file.txt');
      expect(result.path).toBe('existing-file.txt');
      expect(result.content).toBe('Hello, World!');
    });

    it('should throw an error for a non-existent file', async () => {
      await expect(
        createDefaultTestEnvironment().readFile('non-existent-file.txt'),
      ).rejects.toThrow('File not found: non-existent-file.txt');
    });

    it('should throw an error for an invalid path', async () => {
      await expect(
        createDefaultTestEnvironment().readFile('../invalid-path.txt'),
      ).rejects.toThrow('Path traversal is not allowed.');
    });
  });

  describe('writeFile', () => {
    it('should write a new file', async () => {
      const env = createDefaultTestEnvironment();
      const result = await env.writeFile('new-file.txt', 'New content');
      expect(result.path).toBe('new-file.txt');
      expect(result.message).toBe('File written successfully.');
      const fileContent = await env.readFile('new-file.txt');
      expect(fileContent.content).toBe('New content');
    });

    it('should overwrite an existing file', async () => {
      const env = createDefaultTestEnvironment();
      const result = await env.writeFile(
        'existing-file.txt',
        'Overwritten content',
      );
      expect(result.path).toBe('existing-file.txt');
      const fileContent = await env.readFile('existing-file.txt');
      expect(fileContent.content).toBe('Overwritten content');
    });
  });

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      const env = createDefaultTestEnvironment();
      const result = await env.deleteFile('existing-file.txt');
      expect(result.path).toBe('existing-file.txt');
      expect(result.message).toBe('File deleted successfully.');
      await expect(env.readFile('existing-file.txt')).rejects.toThrow(
        'File not found: existing-file.txt',
      );
    });

    it('should return a message for a non-existent file', async () => {
      const result = await createDefaultTestEnvironment().deleteFile(
        'non-existent-file.txt',
      );
      expect(result.path).toBe('non-existent-file.txt');
      expect(result.message).toBe('File was already deleted.');
    });
  });

  describe('moveFile', () => {
    it('should move a file to a new location', async () => {
      const env = createDefaultTestEnvironment();
      const result = await env.moveFile(
        'existing-file.txt',
        'new-location.txt',
      );
      expect(result.sourcePath).toBe('existing-file.txt');
      expect(result.destinationPath).toBe('new-location.txt');
      await expect(env.readFile('existing-file.txt')).rejects.toThrow(
        'File not found: existing-file.txt',
      );
      const newFileContent = await env.readFile('new-location.txt');
      expect(newFileContent.content).toBe('Hello, World!');
    });

    it('should overwrite a file at the destination', async () => {
      const env = createDefaultTestEnvironment();
      const result = await env.moveFile(
        'existing-file.txt',
        'another-file.txt',
      );
      expect(result.sourcePath).toBe('existing-file.txt');
      expect(result.destinationPath).toBe('another-file.txt');
      await expect(env.readFile('existing-file.txt')).rejects.toThrow(
        'File not found: existing-file.txt',
      );
      const newFileContent = await env.readFile('another-file.txt');
      expect(newFileContent.content).toBe('Hello, World!');
    });

    it('should throw an error for a non-existent source file', async () => {
      await expect(
        createDefaultTestEnvironment().moveFile(
          'non-existent-file.txt',
          'new-location.txt',
        ),
      ).rejects.toThrow('File not found: non-existent-file.txt');
    });
  });

  describe('copyFile', () => {
    it('should copy a file to a new location', async () => {
      const env = createDefaultTestEnvironment();
      const result = await env.copyFile(
        'existing-file.txt',
        'new-location.txt',
      );
      expect(result.sourcePath).toBe('existing-file.txt');
      expect(result.destinationPath).toBe('new-location.txt');
      const oldFileContent = await env.readFile('existing-file.txt');
      expect(oldFileContent.content).toBe('Hello, World!');
      const newFileContent = await env.readFile('new-location.txt');
      expect(newFileContent.content).toBe('Hello, World!');
    });

    it('should overwrite a file at the destination', async () => {
      const env = createDefaultTestEnvironment();
      const result = await env.copyFile(
        'existing-file.txt',
        'another-file.txt',
      );
      expect(result.sourcePath).toBe('existing-file.txt');
      expect(result.destinationPath).toBe('another-file.txt');
      const oldFileContent = await env.readFile('existing-file.txt');
      expect(oldFileContent.content).toBe('Hello, World!');
      const newFileContent = await env.readFile('another-file.txt');
      expect(newFileContent.content).toBe('Hello, World!');
    });

    it('should throw an error for a non-existent source file', async () => {
      await expect(
        createDefaultTestEnvironment().copyFile(
          'non-existent-file.txt',
          'new-location.txt',
        ),
      ).rejects.toThrow('File not found: non-existent-file.txt');
    });
  });
});
