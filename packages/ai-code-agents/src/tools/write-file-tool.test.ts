import { describe, expect, it, vi, type Mock } from 'vitest';
import { z } from 'zod';
import type { FilesystemEnvironmentInterface } from '../types';
import { WriteFileTool } from './write-file-tool';

describe('WriteFileTool', () => {
  const mockFsEnv: FilesystemEnvironmentInterface = {
    name: 'mock-fs-env',
    copyFile: vi.fn(),
    deleteFile: vi.fn(),
    moveFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };

  it('should have the correct metadata', () => {
    const tool = new WriteFileTool(mockFsEnv);

    expect(tool.name).toBe('write_file');
    expect(tool.description).toBe(
      'Writes content to a file at the specified path.',
    );
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(false);
  });

  it('should call the environment writeFile method with the correct arguments', async () => {
    const tool = new WriteFileTool(mockFsEnv);
    const input = {
      path: 'file-to-write.txt',
      content: 'file content',
    };

    await tool.execute(input, {} as never);

    expect(mockFsEnv.writeFile).toHaveBeenCalledExactlyOnceWith(
      input.path,
      input.content,
    );
  });

  it('should return the result from the environment writeFile method', async () => {
    const expectedResult = { success: true };
    (mockFsEnv.writeFile as Mock).mockResolvedValue(expectedResult);

    const tool = new WriteFileTool(mockFsEnv);
    const input = {
      path: 'file-to-write.txt',
      content: 'file content',
    };

    const result = await tool.execute(input, {} as never);

    expect(result).toBe(expectedResult);
  });
});
