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

    // Mock find command for GlobTool
    (mockEnv.runCommand as Mock).mockResolvedValueOnce({
      stdout: './file1.ts\n./file2.ts\n./file3.js',
      stderr: '',
      exitCode: 0,
    });

    // Mock grep command
    (mockEnv.runCommand as Mock).mockResolvedValueOnce({
      stdout: 'file1.ts:10:test match\nfile2.ts:20:another test',
      stderr: '',
      exitCode: 0,
    });

    const result = await tool.execute(input, {} as never);

    expect(mockEnv.runCommand).toHaveBeenCalledTimes(2);
    // First call is find (from GlobTool)
    expect(mockEnv.runCommand).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('find'),
    );
    // Second call is grep
    expect(mockEnv.runCommand).toHaveBeenNthCalledWith(
      2,
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

    // Mock find command
    (mockEnv.runCommand as Mock).mockResolvedValueOnce({
      stdout: './file1.ts',
      stderr: '',
      exitCode: 0,
    });

    // Mock grep command returning exit code 1 (no matches)
    (mockEnv.runCommand as Mock).mockResolvedValueOnce({
      stdout: '',
      stderr: '',
      exitCode: 1,
    });

    const result = await tool.execute(input, {} as never);

    expect(result.matches).toHaveLength(0);
  });

  it('should include context lines when requested', async () => {
    const tool = new GrepTool(mockEnv);
    const input = {
      regexpPattern: 'match',
      contextLines: 1,
    };

    // Mock find command
    (mockEnv.runCommand as Mock).mockResolvedValueOnce({
      stdout: './file1.ts',
      stderr: '',
      exitCode: 0,
    });

    // Mock grep command
    (mockEnv.runCommand as Mock).mockResolvedValueOnce({
      stdout: 'file1.ts:2:match line',
      stderr: '',
      exitCode: 0,
    });

    // Mock readFile for context
    (mockEnv.readFile as Mock).mockImplementation(async (path: string) => {
      if (path === 'file1.ts') {
        return {
          content: 'line 1\nmatch line\nline 3',
        };
      }
      throw new Error('File not found');
    });

    const result = await tool.execute(input, {} as never);

    expect(mockEnv.readFile).toHaveBeenCalledWith('file1.ts');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].beforeContext).toEqual(['line 1']);
    expect(result.matches[0].afterContext).toEqual(['line 3']);
  });

  it('should batch files for grep command', async () => {
    const tool = new GrepTool(mockEnv);
    const input = {
      regexpPattern: 'test',
    };

    // Generate 60 files to trigger batching (BATCH_SIZE is 50)
    const files = Array.from({ length: 60 }, (_, i) => `./file${i}.ts`).join(
      '\n',
    );

    // Mock find command
    (mockEnv.runCommand as Mock).mockResolvedValueOnce({
      stdout: files,
      stderr: '',
      exitCode: 0,
    });

    // Mock grep command calls
    (mockEnv.runCommand as Mock).mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: 1,
    });

    await tool.execute(input, {} as never);

    // 1 call for find, 2 calls for grep (50 + 10 files)
    expect(mockEnv.runCommand).toHaveBeenCalledTimes(3);
  });
});
