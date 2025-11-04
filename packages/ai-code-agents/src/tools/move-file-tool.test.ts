import { describe, expect, it, vi, type Mock } from 'vitest';
import { z } from 'zod';
import type { FilesystemEnvironmentInterface } from '../types';
import { MoveFileTool } from './move-file-tool';

describe('MoveFileTool', () => {
  const mockFsEnv: FilesystemEnvironmentInterface = {
    name: 'mock-fs-env',
    copyFile: vi.fn(),
    deleteFile: vi.fn(),
    moveFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };

  it('should have the correct metadata', () => {
    const tool = new MoveFileTool(mockFsEnv);

    expect(tool.name).toBe('move_file');
    expect(tool.description).toBe(
      'Moves a file from a source path to a destination path.',
    );
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(false);
  });

  it('should call the environment moveFile method with the correct arguments', async () => {
    const tool = new MoveFileTool(mockFsEnv);
    const input = {
      sourcePath: 'source.txt',
      destinationPath: 'destination.txt',
    };

    await tool.execute(input, {} as never);

    expect(mockFsEnv.moveFile).toHaveBeenCalledExactlyOnceWith(
      input.sourcePath,
      input.destinationPath,
    );
  });

  it('should return the result from the environment moveFile method', async () => {
    const expectedResult = { success: true };
    (mockFsEnv.moveFile as Mock).mockResolvedValue(expectedResult);

    const tool = new MoveFileTool(mockFsEnv);
    const input = {
      sourcePath: 'source.txt',
      destinationPath: 'destination.txt',
    };

    const result = await tool.execute(input, {} as never);

    expect(result).toBe(expectedResult);
  });
});
