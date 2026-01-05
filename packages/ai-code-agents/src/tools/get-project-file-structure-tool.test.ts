import { describe, expect, it, vi, type Mock, beforeEach } from 'vitest';
import { z } from 'zod';
import type { CommandLineEnvironmentInterface } from '../types';
import { GetProjectFileStructureTool } from './get-project-file-structure-tool';

describe('GetProjectFileStructureTool', () => {
  const mockEnv: CommandLineEnvironmentInterface = {
    name: 'mock-env',
    readFile: vi.fn(),
    writeFile: vi.fn(),
    deleteFile: vi.fn(),
    moveFile: vi.fn(),
    copyFile: vi.fn(),
    runCommand: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have the correct metadata', () => {
    const tool = new GetProjectFileStructureTool(mockEnv);

    expect(tool.name).toBe('get_project_file_structure');
    expect(tool.description).toBe(
      'Recursively lists all files in the project directory and formats them as a tree structure.',
    );
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(false);
  });

  it('should call the environment runCommand method with the correct arguments', async () => {
    (mockEnv.runCommand as Mock).mockImplementation(async (command: string) => {
      if (command.includes('pwd')) {
        return { command, exitCode: 0, stdout: '/project', stderr: '' };
      }
      if (command.includes('while')) {
        return { command, exitCode: 0, stdout: '', stderr: '' };
      }
      return {
        command,
        exitCode: 0,
        stdout: '',
        stderr: '',
      };
    });

    const tool = new GetProjectFileStructureTool(mockEnv);
    const input = { path: 'src' };

    await tool.execute(input, {} as never);

    expect(mockEnv.runCommand).toHaveBeenCalledWith(
      "find 'src' -type f | sort",
    );
  });

  it('should default to "." if no path is provided', async () => {
    (mockEnv.runCommand as Mock).mockImplementation(async (command: string) => {
      if (command.includes('pwd')) {
        return { command, exitCode: 0, stdout: '/project', stderr: '' };
      }
      if (command.includes('while')) {
        return { command, exitCode: 0, stdout: '', stderr: '' };
      }
      return {
        command,
        exitCode: 0,
        stdout: '',
        stderr: '',
      };
    });

    const tool = new GetProjectFileStructureTool(mockEnv);
    const input = {};

    await tool.execute(input, {} as never);

    expect(mockEnv.runCommand).toHaveBeenCalledWith("find '.' -type f | sort");
  });

  it('should return the result from the environment runCommand method', async () => {
    const expectedStdout = 'file1.txt\nfile2.js\n';
    (mockEnv.runCommand as Mock).mockImplementation(async (command: string) => {
      if (command.includes('pwd')) {
        return { command, exitCode: 0, stdout: '/project', stderr: '' };
      }
      if (command.includes('while')) {
        return { command, exitCode: 0, stdout: '', stderr: '' };
      }
      return {
        command,
        exitCode: 0,
        stdout: expectedStdout,
        stderr: '',
      };
    });

    const tool = new GetProjectFileStructureTool(mockEnv);
    const input = {};
    const result = await tool.execute(input, {} as never);

    expect(result).toEqual({
      files: ['file1.txt', 'file2.js'],
      excludeGitIgnored: true,
    });
  });

  it('should handle files with leading ./', async () => {
    const expectedStdout = './file1.txt\n./dir/file2.js\n';
    (mockEnv.runCommand as Mock).mockImplementation(async (command: string) => {
      if (command.includes('pwd')) {
        return { command, exitCode: 0, stdout: '/project', stderr: '' };
      }
      if (command.includes('while')) {
        return { command, exitCode: 0, stdout: '', stderr: '' };
      }
      return {
        command,
        exitCode: 0,
        stdout: expectedStdout,
        stderr: '',
      };
    });

    const tool = new GetProjectFileStructureTool(mockEnv);
    const input = {};
    const result = await tool.execute(input, {} as never);

    expect(result).toEqual({
      files: ['file1.txt', 'dir/file2.js'],
      excludeGitIgnored: true,
    });
  });

  it('should throw an error if the command fails', async () => {
    (mockEnv.runCommand as Mock).mockImplementation(async (command: string) => {
      if (command.includes('pwd')) {
        return { command, exitCode: 0, stdout: '/project', stderr: '' };
      }
      if (command.includes('while')) {
        return { command, exitCode: 0, stdout: '', stderr: '' };
      }
      return {
        command,
        exitCode: 1,
        stdout: '',
        stderr: 'find: .: No such file or directory',
      };
    });

    const tool = new GetProjectFileStructureTool(mockEnv);
    const input = {};

    await expect(tool.execute(input, {} as never)).rejects.toThrow(
      'Failed to get project file structure with command "find \'.\' -type f | sort": find: .: No such file or directory',
    );
  });

  it('should format the output as a tree for model consumption', async () => {
    const tool = new GetProjectFileStructureTool(mockEnv);
    const output = {
      files: ['src/index.ts', 'src/util/helper.ts', 'package.json'],
      excludeGitIgnored: true,
    };

    const result = tool.toModelOutput({
      toolCallId: 'test-call',
      input: {},
      output,
    });

    expect(result).toEqual({
      type: 'text',
      value: `├── **package.json**
└── **src**
    ├── **index.ts**
    └── **util**
        └── **helper.ts**`,
    });
  });

  it('should return "No files found." if there are no files', async () => {
    const tool = new GetProjectFileStructureTool(mockEnv);
    const output = {
      files: [],
      excludeGitIgnored: true,
    };

    const result = tool.toModelOutput({
      toolCallId: 'test-call',
      input: {},
      output,
    });

    expect(result).toEqual({
      type: 'text',
      value: 'No files found.',
    });
  });

  it('should not exclude git ignored files when excludeGitIgnored is false', async () => {
    (mockEnv.runCommand as Mock).mockImplementation(
      async (command: string) => ({
        command,
        exitCode: 0,
        stdout: 'file1.txt\nfile2.js\n',
        stderr: '',
      }),
    );

    const tool = new GetProjectFileStructureTool(mockEnv);
    const input = { excludeGitIgnored: false };

    await tool.execute(input, {} as never);

    expect(mockEnv.runCommand).toHaveBeenCalledExactlyOnceWith(
      "find '.' -type f | sort",
    );
    expect(mockEnv.runCommand).not.toHaveBeenCalledWith(
      expect.stringContaining('while'),
    );
  });

  it('should exclude git ignored files when excludeGitIgnored is true', async () => {
    (mockEnv.runCommand as Mock).mockImplementation(async (command: string) => {
      // Mock pwd command.
      if (command === 'pwd') {
        return { command, exitCode: 0, stdout: '/project', stderr: '' };
      }
      // Mock gitignore lookup using POSIX-compliant [ ] syntax.
      if (command.includes('while') && command.includes('.gitignore')) {
        return {
          command,
          exitCode: 0,
          stdout: '/project/.gitignore',
          stderr: '',
        };
      }
      // Mock cat .gitignore.
      if (command.includes('cat') && command.includes('.gitignore')) {
        return {
          command,
          exitCode: 0,
          stdout: 'node_modules/\ndist/\n',
          stderr: '',
        };
      }
      // Mock find command - return files excluding gitignored.
      if (command.includes('find')) {
        return {
          command,
          exitCode: 0,
          stdout: 'src/index.ts\npackage.json\n',
          stderr: '',
        };
      }
      return { command, exitCode: 0, stdout: '', stderr: '' };
    });

    const tool = new GetProjectFileStructureTool(mockEnv);
    const input = { excludeGitIgnored: true };

    const result = await tool.execute(input, {} as never);

    expect(result.excludeGitIgnored).toBe(true);
    expect(result.files).toEqual(['src/index.ts', 'package.json']);

    // Verify the find command includes exclusion patterns.
    expect(mockEnv.runCommand).toHaveBeenCalledWith(
      expect.stringContaining('-not -path'),
    );
  });
});
