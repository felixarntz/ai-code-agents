import { describe, expect, it, vi, type Mock } from 'vitest';
import { z } from 'zod';
import type { FilesystemEnvironmentInterface } from '../types';
import { DeleteFileTool } from './delete-file-tool';

describe('DeleteFileTool', () => {
  const mockFsEnv: FilesystemEnvironmentInterface = {
    name: 'mock-fs-env',
    copyFile: vi.fn(),
    deleteFile: vi.fn(),
    moveFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };

  it('should have the correct metadata', () => {
    const tool = new DeleteFileTool(mockFsEnv);

    expect(tool.name).toBe('delete_file');
    expect(tool.description).toBe('Deletes the file at the specified path.');
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(true);
  });

  it('should call the environment deleteFile method with the correct arguments', async () => {
    const tool = new DeleteFileTool(mockFsEnv);
    const input = {
      path: 'file-to-delete.txt',
    };

    await tool.execute(input, {} as never);

    expect(mockFsEnv.deleteFile).toHaveBeenCalledExactlyOnceWith(input.path);
  });

  it('should return the result from the environment deleteFile method', async () => {
    const expectedResult = { success: true };
    (mockFsEnv.deleteFile as Mock).mockResolvedValue(expectedResult);

    const tool = new DeleteFileTool(mockFsEnv);
    const input = {
      path: 'file-to-delete.txt',
    };

    const result = await tool.execute(input, {} as never);

    expect(result).toBe(expectedResult);
  });
});
