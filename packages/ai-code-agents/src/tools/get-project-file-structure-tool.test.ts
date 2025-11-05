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
    (mockEnv.runCommand as Mock).mockResolvedValue({
      command: 'find src -type f | sort',
      exitCode: 0,
      stdout: '',
      stderr: '',
    });
    (mockEnv.readFile as Mock).mockResolvedValue({
      content: '',
    });

    const tool = new GetProjectFileStructureTool(mockEnv);
    const input = { path: 'src' };

    await tool.execute(input, {} as never);

    expect(mockEnv.runCommand).toHaveBeenCalledExactlyOnceWith(
      "find 'src' -type f | sort",
    );
  });

  it('should default to "." if no path is provided', async () => {
    (mockEnv.runCommand as Mock).mockClear();
    (mockEnv.runCommand as Mock).mockResolvedValue({
      command: 'find . -type f | sort',
      exitCode: 0,
      stdout: '',
      stderr: '',
    });
    (mockEnv.readFile as Mock).mockResolvedValue({
      content: '',
    });

    const tool = new GetProjectFileStructureTool(mockEnv);
    const input = {};

    await tool.execute(input, {} as never);

    expect(mockEnv.runCommand).toHaveBeenCalledExactlyOnceWith(
      "find '.' -type f | sort",
    );
  });

  it('should return the result from the environment runCommand method', async () => {
    const expectedStdout = 'file1.txt\nfile2.js\n';
    (mockEnv.runCommand as Mock).mockResolvedValue({
      command: 'find . -type f | sort',
      exitCode: 0,
      stdout: expectedStdout,
      stderr: '',
    });
    (mockEnv.readFile as Mock).mockResolvedValue({
      content: '',
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
    (mockEnv.runCommand as Mock).mockResolvedValue({
      command: 'find . -type f | sort',
      exitCode: 0,
      stdout: expectedStdout,
      stderr: '',
    });
    (mockEnv.readFile as Mock).mockResolvedValue({
      content: '',
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
    (mockEnv.runCommand as Mock).mockResolvedValue({
      command: 'find . -type f | sort',
      exitCode: 1,
      stdout: '',
      stderr: 'find: .: No such file or directory',
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
      files: ['src/index.js', 'src/components/Button.js', 'README.md'],
      excludeGitIgnored: true,
    };

    const result = tool.toModelOutput(output);

    expect(result).toEqual({
      type: 'text',
      value: `├── **README.md**
└── **src**
    ├── **components**
    │   └── **Button.js**
    └── **index.js**`,
    });
  });

  it('should return "No files found." if there are no files', async () => {
    const tool = new GetProjectFileStructureTool(mockEnv);
    const output = {
      files: [],
      excludeGitIgnored: true,
    };

    const result = tool.toModelOutput(output);

    expect(result).toEqual({
      type: 'text',
      value: 'No files found.',
    });
  });

  it('should not exclude git ignored files when excludeGitIgnored is false', async () => {
    const expectedStdout = 'file1.txt\nfile2.js\n';
    (mockEnv.runCommand as Mock).mockResolvedValue({
      command: 'find . -type f | sort',
      exitCode: 0,
      stdout: expectedStdout,
      stderr: '',
    });

    const tool = new GetProjectFileStructureTool(mockEnv);
    const input = { excludeGitIgnored: false };
    const result = await tool.execute(input, {} as never);

    expect(mockEnv.readFile).not.toHaveBeenCalled();
    expect(result).toEqual({
      files: ['file1.txt', 'file2.js'],
      excludeGitIgnored: false,
    });
  });
});
