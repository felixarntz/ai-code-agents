import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { z } from 'zod';
import type { CommandLineEnvironmentInterface } from '../types';
import { GrepTool } from './grep-tool';

describe('GrepTool', () => {
  let mockEnv: CommandLineEnvironmentInterface;

  beforeEach(() => {
    mockEnv = {
      name: 'mock-env',
      runCommand: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      deleteFile: vi.fn(),
      moveFile: vi.fn(),
      copyFile: vi.fn(),
    };

    // Default behavior for readFile (e.g. for .gitignore)
    (mockEnv.readFile as Mock).mockRejectedValue(new Error('File not found'));
  });

  it('should have the correct metadata', () => {
    const tool = new GrepTool(mockEnv);

    expect(tool.name).toBe('grep');
    expect(tool.description).toBe(
      'Searches for a regular expression pattern within the content of files in the project.',
    );
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(false);
  });

  it('should execute grep on files found by glob', async () => {
    const tool = new GrepTool(mockEnv);
    const input = {
      regexpPattern: 'test',
      searchPattern: '**/*.ts',
    };

    // Mock commands
    (mockEnv.runCommand as Mock).mockImplementation(async (command: string) => {
      if (command.includes('pwd')) {
        return { command, exitCode: 0, stdout: '/project', stderr: '' };
      }
      if (command.includes('while')) {
        return { command, exitCode: 0, stdout: '', stderr: '' };
      }
      if (command.includes('find')) {
        return {
          command,
          exitCode: 0,
          stdout: './file1.ts\n./file2.ts\n./file3.js',
          stderr: '',
        };
      }
      if (command.includes('grep')) {
        return {
          command,
          exitCode: 0,
          stdout: 'file1.ts:10:test match\nfile2.ts:20:another test',
          stderr: '',
        };
      }
      return { command, exitCode: 0, stdout: '', stderr: '' };
    });

    const result = await tool.execute(input, {} as never);

    // First call is pwd, second is while (gitignore), third is find, fourth is grep
    expect(mockEnv.runCommand).toHaveBeenCalledWith(
      expect.stringContaining('find'),
    );
    expect(mockEnv.runCommand).toHaveBeenCalledWith(
      expect.stringContaining("grep -n -H -I -E 'test'"),
    );

    expect(result.matches).toHaveLength(2);
    expect(result.matches[0]).toEqual({
      path: 'file1.ts',
      lineNumber: 10,
      line: 'test match',
    });
    expect(result.matches[1]).toEqual({
      path: 'file2.ts',
      lineNumber: 20,
      line: 'another test',
    });
  });

  it('should handle no matches found', async () => {
    const tool = new GrepTool(mockEnv);
    const input = {
      regexpPattern: 'notfound',
    };

    // Mock commands
    (mockEnv.runCommand as Mock).mockImplementation(async (command: string) => {
      if (command.includes('pwd')) {
        return { command, exitCode: 0, stdout: '/project', stderr: '' };
      }
      if (command.includes('while')) {
        return { command, exitCode: 0, stdout: '', stderr: '' };
      }
      if (command.includes('find')) {
        return {
          command,
          exitCode: 0,
          stdout: './file1.ts',
          stderr: '',
        };
      }
      if (command.includes('grep')) {
        return {
          command,
          exitCode: 1,
          stdout: '',
          stderr: '',
        };
      }
      return { command, exitCode: 0, stdout: '', stderr: '' };
    });

    const result = await tool.execute(input, {} as never);

    expect(result.matches).toHaveLength(0);
  });

  it('should include context lines when requested', async () => {
    const tool = new GrepTool(mockEnv);
    const input = {
      regexpPattern: 'test',
      contextLines: 2,
    };

    // Mock commands
    (mockEnv.runCommand as Mock).mockImplementation(async (command: string) => {
      if (command.includes('pwd')) {
        return { command, exitCode: 0, stdout: '/project', stderr: '' };
      }
      if (command.includes('while')) {
        return { command, exitCode: 0, stdout: '', stderr: '' };
      }
      if (command.includes('find')) {
        return {
          command,
          exitCode: 0,
          stdout: './file1.ts',
          stderr: '',
        };
      }
      if (command.includes('grep')) {
        return {
          command,
          exitCode: 0,
          stdout: 'file1.ts:3:test match',
          stderr: '',
        };
      }
      return { command, exitCode: 0, stdout: '', stderr: '' };
    });

    // Mock readFile for context
    (mockEnv.readFile as Mock).mockResolvedValue({
      content: 'line 8\nline 9\ntest match\nline 11\nline 12',
    });

    const result = await tool.execute(input, {} as never);

    expect(mockEnv.runCommand).toHaveBeenCalledWith(
      expect.stringContaining('grep'),
    );
    expect(mockEnv.readFile).toHaveBeenCalledWith('file1.ts');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].line).toBe('test match');
    expect(result.matches[0].beforeContext).toEqual(['line 8', 'line 9']);
    expect(result.matches[0].afterContext).toEqual(['line 11', 'line 12']);
  });

  it('should batch files for grep command', async () => {
    const tool = new GrepTool(mockEnv);
    const input = {
      regexpPattern: 'test',
    };

    // Mock many files for GlobTool
    const files = Array.from({ length: 150 }, (_, i) => `./file${i}.ts`).join(
      '\n',
    );
    (mockEnv.runCommand as Mock).mockImplementation(async (command: string) => {
      if (command.includes('pwd')) {
        return { command, exitCode: 0, stdout: '/project', stderr: '' };
      }
      if (command.includes('while')) {
        return { command, exitCode: 0, stdout: '', stderr: '' };
      }
      if (command.includes('find')) {
        return {
          command,
          exitCode: 0,
          stdout: files,
          stderr: '',
        };
      }
      if (command.includes('grep')) {
        return {
          command,
          exitCode: 0,
          stdout: '',
          stderr: '',
        };
      }
      return { command, exitCode: 0, stdout: '', stderr: '' };
    });

    await tool.execute(input, {} as never);

    // Should be called multiple times for grep due to batching (150 files, batch size 100)
    // pwd (1) + while (1) + find (1) + grep (2) = 5
    expect(mockEnv.runCommand).toHaveBeenCalledTimes(5);
  });
});
