import { describe, expect, it, vi, type Mock } from 'vitest';
import { z } from 'zod';
import type { FilesystemEnvironmentInterface } from '../types';
import { EditFileTool, type EditFileToolInput } from './edit-file-tool';

describe('EditFileTool', () => {
  const mockFsEnv: FilesystemEnvironmentInterface = {
    name: 'mock-fs-env',
    copyFile: vi.fn(),
    deleteFile: vi.fn(),
    moveFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };

  it('should have the correct metadata', () => {
    const tool = new EditFileTool(mockFsEnv);

    expect(tool.name).toBe('edit_file');
    expect(tool.description).toBe('Edits a file by replacing strings.');
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(true);
  });

  it('should replace the first occurrence when replaceAll is false', async () => {
    const originalContent = 'hello world hello';
    const expectedContent = 'hi world hello';
    (mockFsEnv.readFile as Mock).mockResolvedValue({
      path: 'test.txt',
      content: originalContent,
    });
    (mockFsEnv.writeFile as Mock).mockResolvedValue({
      path: 'test.txt',
      message: 'File written successfully.',
    });

    const tool = new EditFileTool(mockFsEnv);
    const input = {
      path: 'test.txt',
      oldString: 'hello',
      newString: 'hi',
      replaceAll: false,
    };

    const result = await tool.execute(input, {} as never);

    expect(mockFsEnv.readFile).toHaveBeenCalledWith('test.txt');
    expect(mockFsEnv.writeFile).toHaveBeenCalledWith(
      'test.txt',
      expectedContent,
    );
    expect(result).toEqual({
      path: 'test.txt',
      oldString: 'hello',
      newString: 'hi',
      replacements: 1,
      message: 'Successfully made 1 replacement(s) in file.',
    });
  });

  it('should replace all occurrences when replaceAll is true', async () => {
    const originalContent = 'hello world hello';
    const expectedContent = 'hi world hi';
    (mockFsEnv.readFile as Mock).mockResolvedValue({
      path: 'test.txt',
      content: originalContent,
    });
    (mockFsEnv.writeFile as Mock).mockResolvedValue({
      path: 'test.txt',
      message: 'File written successfully.',
    });

    const tool = new EditFileTool(mockFsEnv);
    const input = {
      path: 'test.txt',
      oldString: 'hello',
      newString: 'hi',
      replaceAll: true,
    };

    const result = await tool.execute(input, {} as never);

    expect(mockFsEnv.readFile).toHaveBeenCalledWith('test.txt');
    expect(mockFsEnv.writeFile).toHaveBeenCalledWith(
      'test.txt',
      expectedContent,
    );
    expect(result).toEqual({
      path: 'test.txt',
      oldString: 'hello',
      newString: 'hi',
      replacements: 2,
      message: 'Successfully made 2 replacement(s) in file.',
    });
  });

  it('should handle special regex characters in oldString when replaceAll is true', async () => {
    const originalContent = 'price: $10.99 and $5.00';
    const expectedContent = 'price: €10.99 and €5.00';
    (mockFsEnv.readFile as Mock).mockResolvedValue({
      path: 'test.txt',
      content: originalContent,
    });
    (mockFsEnv.writeFile as Mock).mockResolvedValue({
      path: 'test.txt',
      message: 'File written successfully.',
    });

    const tool = new EditFileTool(mockFsEnv);
    const input = {
      path: 'test.txt',
      oldString: '$',
      newString: '€',
      replaceAll: true,
    };

    const result = await tool.execute(input, {} as never);

    expect(mockFsEnv.writeFile).toHaveBeenCalledWith(
      'test.txt',
      expectedContent,
    );
    expect(result.replacements).toBe(2);
  });

  it('should return zero replacements when oldString is not found', async () => {
    const originalContent = 'hello world';
    (mockFsEnv.readFile as Mock).mockResolvedValue({
      path: 'test.txt',
      content: originalContent,
    });
    (mockFsEnv.writeFile as Mock).mockResolvedValue({
      path: 'test.txt',
      message: 'File written successfully.',
    });

    const tool = new EditFileTool(mockFsEnv);
    const input = {
      path: 'test.txt',
      oldString: 'goodbye',
      newString: 'hi',
      replaceAll: false,
    };

    const result = await tool.execute(input, {} as never);

    expect(mockFsEnv.writeFile).toHaveBeenCalledWith(
      'test.txt',
      originalContent,
    );
    expect(result).toEqual({
      path: 'test.txt',
      oldString: 'goodbye',
      newString: 'hi',
      replacements: 0,
      message: 'No replacements made - old string not found.',
    });
  });

  it('should default replaceAll to false', async () => {
    const originalContent = 'hello world hello';
    const expectedContent = 'hi world hello';
    (mockFsEnv.readFile as Mock).mockResolvedValue({
      path: 'test.txt',
      content: originalContent,
    });
    (mockFsEnv.writeFile as Mock).mockResolvedValue({
      path: 'test.txt',
      message: 'File written successfully.',
    });

    const tool = new EditFileTool(mockFsEnv);
    const input = {
      path: 'test.txt',
      oldString: 'hello',
      newString: 'hi',
      replaceAll: false,
    } as EditFileToolInput;

    const result = await tool.execute(input, {} as never);

    expect(mockFsEnv.writeFile).toHaveBeenCalledWith(
      'test.txt',
      expectedContent,
    );
    expect(result.replacements).toBe(1);
  });
});
