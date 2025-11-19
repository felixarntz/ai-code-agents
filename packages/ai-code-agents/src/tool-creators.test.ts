import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import {
  createEnvironmentTool,
  createToolsForEnvironment,
  createToolsForNamedEnvironment,
  EnvironmentToolNames,
} from './tool-creators';
import { MockFilesystemEnvironment } from './environments/mock-filesystem-environment';
import type { CommandLineEnvironmentInterface } from './types';
import { ReadFileTool } from './tools/read-file-tool';
import { WriteFileTool } from './tools/write-file-tool';
import { RunCommandTool } from './tools/run-command-tool';

describe('createEnvironmentTool', () => {
  const mockFsEnv = new MockFilesystemEnvironment();
  const mockCliEnv = {
    ...mockFsEnv,
    runCommand: vi.fn(),
  } as unknown as CommandLineEnvironmentInterface;

  it('should expose the environment tools for every tool in the tools directory', () => {
    const toolsDir = path.resolve(__dirname, 'tools');
    const toolFiles = fs.readdirSync(toolsDir).filter(
      (file) =>
        file.endsWith('.ts') &&
        !file.endsWith('.test.ts') &&
        !file.includes('-base') &&
        !file.includes('submit-tool'), // Exclude non-environment tool.
    );

    const expectedToolNames = toolFiles.map((file) => {
      const toolName = file.replace('-tool.ts', '').split('-').join('_');
      return toolName;
    });

    for (const expectedToolName of expectedToolNames) {
      expect(EnvironmentToolNames).toContain(expectedToolName);
    }
  });

  it.each(EnvironmentToolNames)('should create a %s instance', (toolName) => {
    const tool = createEnvironmentTool(toolName, mockCliEnv);
    expect(tool.name).toBe(toolName);
  });

  it('should throw an error for an unsupported tool name', () => {
    expect(() =>
      createEnvironmentTool(
        'unsupported_tool' as 'read_file',
        new MockFilesystemEnvironment(),
      ),
    ).toThrow('Unsupported environment: unsupported_tool');
  });
});

describe('createToolsForEnvironment', () => {
  const mockFsEnv = new MockFilesystemEnvironment();
  const mockCliEnv = {
    ...mockFsEnv,
    runCommand: vi.fn(),
  } as unknown as CommandLineEnvironmentInterface;

  it("should create all tools when 'all' is specified", () => {
    const tools = createToolsForEnvironment(mockCliEnv, 'all');
    expect(Object.keys(tools)).toEqual(EnvironmentToolNames);
    expect(tools['read_file']).toBeInstanceOf(ReadFileTool);
    expect(tools['run_command']).toBeInstanceOf(RunCommandTool);
  });

  it("should create readonly tools when 'readonly' is specified", () => {
    const tools = createToolsForEnvironment(mockCliEnv, 'readonly');
    expect(Object.keys(tools)).toEqual([
      'read_file',
      'read_many_files',
      'get_project_file_structure',
      'glob',
      'grep',
      'list_directory',
    ]);
    expect(tools['read_file']).toBeInstanceOf(ReadFileTool);
  });

  it("should create all except dangerous tools when 'basic' is specified", () => {
    const tools = createToolsForEnvironment(mockCliEnv, 'basic');
    expect(Object.keys(tools)).toEqual([
      'read_file',
      'write_file',
      'edit_file',
      'move_file',
      'copy_file',
      'read_many_files',
      'get_project_file_structure',
      'glob',
      'grep',
      'list_directory',
    ]);
    expect(tools['write_file']).toBeInstanceOf(WriteFileTool);
  });

  it('should create a subset of tools', () => {
    const tools = createToolsForEnvironment(mockCliEnv, [
      'read_file',
      'write_file',
    ]);
    expect(Object.keys(tools)).toEqual(['read_file', 'write_file']);
    expect(tools['read_file']).toBeInstanceOf(ReadFileTool);
    expect(tools['write_file']).toBeInstanceOf(WriteFileTool);
  });

  it('should create tools with custom configuration', () => {
    const tools = createToolsForEnvironment(mockCliEnv, [
      { toolName: 'read_file', toolConfig: { name: 'custom_read' } },
    ]);
    expect(Object.keys(tools)).toEqual(['custom_read']);
    expect(tools['custom_read']).toBeInstanceOf(ReadFileTool);
  });

  it('should throw an error for CLI tools in a non-CLI environment', () => {
    expect(() => createToolsForEnvironment(mockFsEnv, ['run_command'])).toThrow(
      'The "run_command" tool can only be used with command-line environments.',
    );
    expect(() => createToolsForEnvironment(mockFsEnv, ['glob'])).toThrow(
      'The "glob" tool can only be used with command-line environments.',
    );
    expect(() => createToolsForEnvironment(mockFsEnv, ['grep'])).toThrow(
      'The "grep" tool can only be used with command-line environments.',
    );
    expect(() =>
      createToolsForEnvironment(mockFsEnv, ['list_directory']),
    ).toThrow(
      'The "list_directory" tool can only be used with command-line environments.',
    );
  });

  it('should throw an error for duplicate tool names', () => {
    expect(() =>
      createToolsForEnvironment(mockCliEnv, [
        'read_file',
        { toolName: 'copy_file', toolConfig: { name: 'read_file' } },
      ]),
    ).toThrow('Multiple tools named "read_file" are provided');
  });
});

describe('createToolsForNamedEnvironment', () => {
  const mockFsEnv = new MockFilesystemEnvironment();
  const mockCliEnv = {
    ...mockFsEnv,
    runCommand: vi.fn(),
  } as unknown as CommandLineEnvironmentInterface;

  it('should create tools with namespaced names', () => {
    const tools = createToolsForNamedEnvironment('my_env', mockCliEnv, [
      'read_file',
      'write_file',
    ]);
    expect(Object.keys(tools)).toEqual([
      'read_file_in_my_env',
      'write_file_in_my_env',
    ]);
    expect(tools['read_file_in_my_env']).toBeInstanceOf(ReadFileTool);
  });

  it('should handle custom names correctly', () => {
    const tools = createToolsForNamedEnvironment('my_env', mockCliEnv, [
      { toolName: 'read_file', toolConfig: { name: 'custom_read' } },
    ]);
    expect(Object.keys(tools)).toEqual(['custom_read_in_my_env']);
  });

  it("should create all tools with namespaced names when 'all' is specified", () => {
    const tools = createToolsForNamedEnvironment('my_env', mockCliEnv, 'all');
    const expectedNames = EnvironmentToolNames.map(
      (name) => `${name}_in_my_env`,
    );
    expect(Object.keys(tools)).toEqual(expectedNames);
  });

  it("should create readonly tools with namespaced names when 'readonly' is specified", () => {
    const tools = createToolsForNamedEnvironment(
      'my_env',
      mockCliEnv,
      'readonly',
    );
    const expectedNames = [
      'read_file',
      'read_many_files',
      'get_project_file_structure',
      'glob',
      'grep',
      'list_directory',
    ].map((name) => `${name}_in_my_env`);
    expect(Object.keys(tools)).toEqual(expectedNames);
  });

  it("should create all except dangerous tools with namespaced names when 'basic' is specified", () => {
    const tools = createToolsForNamedEnvironment('my_env', mockCliEnv, 'basic');
    const expectedNames = [
      'read_file',
      'write_file',
      'edit_file',
      'move_file',
      'copy_file',
      'read_many_files',
      'get_project_file_structure',
      'glob',
      'grep',
      'list_directory',
    ].map((name) => `${name}_in_my_env`);
    expect(Object.keys(tools)).toEqual(expectedNames);
  });
});
