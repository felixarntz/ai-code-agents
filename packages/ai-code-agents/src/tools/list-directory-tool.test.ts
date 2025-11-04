import { describe, expect, it, vi, type Mock } from 'vitest';
import { z } from 'zod';
import type { CommandLineEnvironmentInterface } from '../types';
import { ListDirectoryTool } from './list-directory-tool';

describe('ListDirectoryTool', () => {
  const mockCmdEnv: CommandLineEnvironmentInterface = {
    name: 'mock-cmd-env',
    copyFile: vi.fn(),
    deleteFile: vi.fn(),
    moveFile: vi.fn(),
    readFile: vi.fn(),
    runCommand: vi.fn(),
    writeFile: vi.fn(),
  };

  it('should have the correct metadata', () => {
    const tool = new ListDirectoryTool(mockCmdEnv);

    expect(tool.name).toBe('list_directory');
    expect(tool.description).toBe(
      'Lists all files and directories in the specified directory, differentiating between files and directories. Non-recursive.',
    );
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(false);
  });

  it('should call the environment runCommand method with the correct arguments', async () => {
    (mockCmdEnv.runCommand as Mock).mockResolvedValue({
      command: 'ls -la src',
      exitCode: 0,
      stdout: '',
      stderr: '',
    });

    const tool = new ListDirectoryTool(mockCmdEnv);
    const input = {
      path: 'src',
    };

    await tool.execute(input, {} as never);

    expect(mockCmdEnv.runCommand).toHaveBeenCalledExactlyOnceWith(
      "ls -la 'src'",
    );
  });

  it('should return the parsed result from the environment runCommand method', async () => {
    const mockLsOutput = `total 16
drwxr-xr-x  4 user group  128 Oct 31 16:45 .
drwxr-xr-x 10 user group  320 Oct 31 16:45 ..
-rw-r--r--  1 user group 1024 Oct 31 16:45 file1.txt
-rw-r--r--  1 user group 2048 Oct 31 16:45 file2.ts
drwxr-xr-x  2 user group   64 Oct 31 16:45 components
drwxr-xr-x  2 user group   64 Oct 31 16:45 hooks
lrwxr-xr-x  1 user group    8 Oct 31 16:45 symlink -> target`;

    (mockCmdEnv.runCommand as Mock).mockResolvedValue({
      command: 'ls -la src',
      exitCode: 0,
      stdout: mockLsOutput,
      stderr: '',
    });

    const tool = new ListDirectoryTool(mockCmdEnv);
    const input = {
      path: 'src',
    };

    const result = await tool.execute(input, {} as never);

    expect(result).toEqual({
      path: 'src',
      files: ['file1.txt', 'file2.ts'],
      directories: ['components', 'hooks'],
    });
  });

  it('should handle empty directory', async () => {
    const mockLsOutput = `total 8
drwxr-xr-x  2 user group  64 Oct 31 16:45 .
drwxr-xr-x 10 user group 320 Oct 31 16:45 ..`;

    (mockCmdEnv.runCommand as Mock).mockResolvedValue({
      command: 'ls -la src',
      exitCode: 0,
      stdout: mockLsOutput,
      stderr: '',
    });

    const tool = new ListDirectoryTool(mockCmdEnv);
    const input = {
      path: 'src',
    };

    const result = await tool.execute(input, {} as never);

    expect(result).toEqual({
      path: 'src',
      files: [],
      directories: [],
    });
  });

  it('should throw error on command failure', async () => {
    (mockCmdEnv.runCommand as Mock).mockResolvedValue({
      command: "ls -la 'nonexistent'",
      exitCode: 1,
      stdout: '',
      stderr: 'ls: nonexistent: No such file or directory',
    });

    const tool = new ListDirectoryTool(mockCmdEnv);
    const input = {
      path: 'nonexistent',
    };

    await expect(tool.execute(input, {} as never)).rejects.toThrow(
      'Failed to list directory "nonexistent" with command "ls -la \'nonexistent\'": ls: nonexistent: No such file or directory',
    );
  });
});
