import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type CommandLineEnvironmentInterface } from '../types';
import { GlobTool } from './glob-tool';

const mockCmdEnv: CommandLineEnvironmentInterface = {
  name: 'mock-cmd-env',
  runCommand: vi.fn(),
  copyFile: vi.fn(),
  deleteFile: vi.fn(),
  moveFile: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
};

describe('GlobTool', () => {
  beforeEach(() => {
    vi.mocked(mockCmdEnv.runCommand).mockReset();
    vi.mocked(mockCmdEnv.readFile).mockReset();
  });

  it('should return metadata', () => {
    const tool = new GlobTool(mockCmdEnv);
    expect(tool.name).toBe('glob');
    expect(tool.description).toBe(
      'Runs a glob search to find matching file paths in the project.',
    );
  });

  it('should find files with a simple pattern', async () => {
    const tool = new GlobTool(mockCmdEnv);
    vi.mocked(mockCmdEnv.runCommand).mockImplementation(
      async (command: string) => {
        if (command.includes('pwd')) {
          return { command, exitCode: 0, stdout: '/project', stderr: '' };
        }
        if (command.includes('while')) {
          return { command, exitCode: 0, stdout: '', stderr: '' };
        }
        return {
          command,
          exitCode: 0,
          stdout: './src/index.ts\n./src/util.ts',
          stderr: '',
        };
      },
    );

    const output = await tool.execute(
      {
        searchPattern: 'src/*.ts',
      },
      { toolCallId: 'test', messages: [] },
    );

    expect(mockCmdEnv.runCommand).toHaveBeenCalledWith(
      expect.stringContaining(`find '.' -type f`),
    );
    expect(output.matchingPaths).toEqual(['src/index.ts', 'src/util.ts']);
  });

  it('should handle search path', async () => {
    const tool = new GlobTool(mockCmdEnv);
    vi.mocked(mockCmdEnv.runCommand).mockImplementation(
      async (command: string) => {
        if (command.includes('pwd')) {
          return { command, exitCode: 0, stdout: '/project', stderr: '' };
        }
        if (command.includes('while')) {
          return { command, exitCode: 0, stdout: '', stderr: '' };
        }
        return {
          command,
          exitCode: 0,
          stdout: 'src/components/button.tsx',
          stderr: '',
        };
      },
    );

    const output = await tool.execute(
      {
        searchPattern: '*.tsx',
        searchPath: 'src/components',
      },
      { toolCallId: 'test', messages: [] },
    );

    expect(mockCmdEnv.runCommand).toHaveBeenCalledWith(
      expect.stringContaining(`find 'src/components' -type f`),
    );
    expect(output.matchingPaths).toEqual(['src/components/button.tsx']);
  });

  it('should exclude gitignored files by default', async () => {
    const tool = new GlobTool(mockCmdEnv);
    vi.mocked(mockCmdEnv.runCommand).mockImplementation(
      async (command: string) => {
        if (command.includes('pwd')) {
          return { command, exitCode: 0, stdout: '/project', stderr: '' };
        }
        if (command.includes('while')) {
          return {
            command,
            exitCode: 0,
            stdout: '/project/.gitignore',
            stderr: '',
          };
        }
        if (command.startsWith('cat ')) {
          return {
            command,
            exitCode: 0,
            stdout: 'node_modules/\ndist/',
            stderr: '',
          };
        }
        return {
          command,
          exitCode: 0,
          stdout: 'src/index.ts',
          stderr: '',
        };
      },
    );

    await tool.execute(
      {
        searchPattern: '**/*.ts',
      },
      { toolCallId: 'test', messages: [] },
    );

    const expectedCommand = expect.stringContaining(
      `find '.' -type f -not -path '*/node_modules/*' -not -path '*/dist/*'`,
    );
    expect(mockCmdEnv.runCommand).toHaveBeenCalledWith(expectedCommand);
  });

  it('should not exclude gitignored files when excludeGitIgnored is false', async () => {
    const tool = new GlobTool(mockCmdEnv);
    vi.mocked(mockCmdEnv.runCommand).mockImplementation(
      async (command: string) => ({
        command,
        exitCode: 0,
        stdout: 'src/index.ts\ndist/index.js',
        stderr: '',
      }),
    );

    await tool.execute(
      {
        searchPattern: '**/*',
        excludeGitIgnored: false,
      },
      { toolCallId: 'test', messages: [] },
    );

    expect(mockCmdEnv.runCommand).toHaveBeenCalledWith(
      expect.stringContaining(`find '.' -type f`),
    );
    expect(mockCmdEnv.runCommand).not.toHaveBeenCalledWith(
      expect.stringContaining('-not -path'),
    );
    expect(mockCmdEnv.runCommand).not.toHaveBeenCalledWith(
      expect.stringContaining('while'),
    );
  });

  it('should throw an error if the search pattern starts with a slash', async () => {
    const tool = new GlobTool(mockCmdEnv);
    await expect(
      tool.execute(
        {
          searchPattern: '/src/*.ts',
        },
        { toolCallId: 'test', messages: [] },
      ),
    ).rejects.toThrow(
      'The search pattern must not start with a forward slash.',
    );
  });

  it('should throw an error if the find command fails', async () => {
    const tool = new GlobTool(mockCmdEnv);
    vi.mocked(mockCmdEnv.runCommand).mockImplementation(
      async (command: string) => {
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
          stderr: 'find: invalid argument',
        };
      },
    );

    await expect(
      tool.execute(
        {
          searchPattern: '*.ts',
        },
        { toolCallId: 'test', messages: [] },
      ),
    ).rejects.toThrow('Failed to glob files');
  });

  it('should return no matching files found for model output when no files match', () => {
    const tool = new GlobTool(mockCmdEnv);
    const modelOutput = tool.toModelOutput({
      toolCallId: 'test-call',
      input: {
        searchPattern: '*.ts',
        searchPath: 'src',
      },
      output: {
        searchPattern: '*.ts',
        searchPath: 'src',
        excludeGitIgnored: true,
        matchingPaths: [],
      },
    });
    expect(modelOutput.value).toBe('No matching files found.');
  });

  it('should return a formatted list of matching files for model output', () => {
    const tool = new GlobTool(mockCmdEnv);
    const modelOutput = tool.toModelOutput({
      toolCallId: 'test-call',
      input: {
        searchPattern: '*.ts',
        searchPath: 'src',
      },
      output: {
        searchPattern: '*.ts',
        searchPath: 'src',
        excludeGitIgnored: true,
        matchingPaths: ['src/index.ts', 'src/util.ts'],
      },
    });
    expect(modelOutput.value).toContain('- `src/index.ts`');
    expect(modelOutput.value).toContain('- `src/util.ts`');
  });

  it('should return examples', () => {
    const tool = new GlobTool(mockCmdEnv);
    expect(tool.examples.length).toBeGreaterThan(0);
  });
});
