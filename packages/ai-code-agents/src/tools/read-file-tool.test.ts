import { describe, expect, it, vi, type Mock } from 'vitest';
import { z } from 'zod';
import type { FilesystemEnvironmentInterface } from '../types';
import { ReadFileTool } from './read-file-tool';

describe('ReadFileTool', () => {
  const mockFsEnv: FilesystemEnvironmentInterface = {
    name: 'mock-fs-env',
    copyFile: vi.fn(),
    deleteFile: vi.fn(),
    moveFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };

  it('should have the correct metadata', () => {
    const tool = new ReadFileTool(mockFsEnv);

    expect(tool.name).toBe('read_file');
    expect(tool.description).toBe(
      'Reads the content of a file at the specified path.',
    );
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(false);
  });

  it('should call the environment readFile method with the correct arguments', async () => {
    const tool = new ReadFileTool(mockFsEnv);
    const input = {
      path: 'file-to-read.txt',
    };

    await tool.execute(input, {} as never);

    expect(mockFsEnv.readFile).toHaveBeenCalledExactlyOnceWith(input.path);
  });

  it('should return the result from the environment readFile method', async () => {
    const expectedResult = { success: true, content: 'file content' };
    (mockFsEnv.readFile as Mock).mockResolvedValue(expectedResult);

    const tool = new ReadFileTool(mockFsEnv);
    const input = {
      path: 'file-to-read.txt',
    };

    const result = await tool.execute(input, {} as never);

    expect(result).toBe(expectedResult);
  });
});
