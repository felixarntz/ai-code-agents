import { describe, expect, it, vi, type Mock } from 'vitest';
import { z } from 'zod';
import type { FilesystemEnvironmentInterface } from '../types';
import { CopyFileTool } from './copy-file-tool';

describe('CopyFileTool', () => {
  const mockFsEnv: FilesystemEnvironmentInterface = {
    name: 'mock-fs-env',
    copyFile: vi.fn(),
    deleteFile: vi.fn(),
    moveFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };

  it('should have the correct metadata', () => {
    const tool = new CopyFileTool(mockFsEnv);

    expect(tool.name).toBe('copy_file');
    expect(tool.description).toBe(
      'Copies a file from a source path to a destination path.',
    );
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(false);
  });

  it('should call the environment copyFile method with the correct arguments', async () => {
    const tool = new CopyFileTool(mockFsEnv);
    const input = {
      sourcePath: 'source.txt',
      destinationPath: 'destination.txt',
    };

    await tool.execute(input, {} as never);

    expect(mockFsEnv.copyFile).toHaveBeenCalledExactlyOnceWith(
      input.sourcePath,
      input.destinationPath,
    );
  });

  it('should return the result from the environment copyFile method', async () => {
    const expectedResult = { success: true };
    (mockFsEnv.copyFile as Mock).mockResolvedValue(expectedResult);

    const tool = new CopyFileTool(mockFsEnv);
    const input = {
      sourcePath: 'source.txt',
      destinationPath: 'destination.txt',
    };

    const result = await tool.execute(input, {} as never);

    expect(result).toBe(expectedResult);
  });
});
