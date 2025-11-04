import { describe, expect, it, vi, type Mock } from 'vitest';
import { z } from 'zod';
import type { CommandLineEnvironmentInterface } from '../types';
import { RunCommandTool } from './run-command-tool';

describe('RunCommandTool', () => {
  const mockCmdEnv: CommandLineEnvironmentInterface = {
    name: 'mock-cmd-env',
    runCommand: vi.fn(),
    copyFile: vi.fn(),
    deleteFile: vi.fn(),
    moveFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };

  it('should have the correct metadata', () => {
    const tool = new RunCommandTool(mockCmdEnv);

    expect(tool.name).toBe('run_command');
    expect(tool.description).toBe('Runs the specific CLI command.');
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(true);
  });

  it('should call the environment runCommand method with the correct arguments', async () => {
    const tool = new RunCommandTool(mockCmdEnv);
    const input = {
      command: 'ls -l',
    };

    await tool.execute(input, {} as never);

    expect(mockCmdEnv.runCommand).toHaveBeenCalledExactlyOnceWith(
      input.command,
    );
  });

  it('should return the result from the environment runCommand method', async () => {
    const expectedResult = { success: true, stdout: '...', stderr: '' };
    (mockCmdEnv.runCommand as Mock).mockResolvedValue(expectedResult);

    const tool = new RunCommandTool(mockCmdEnv);
    const input = {
      command: 'ls -l',
    };

    const result = await tool.execute(input, {} as never);

    expect(result).toBe(expectedResult);
  });
});
