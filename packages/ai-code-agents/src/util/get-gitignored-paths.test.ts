import type { CommandLineEnvironmentInterface } from '@ai-code-agents/environment-utils';
import { describe, it, expect, vi } from 'vitest';
import { getGitIgnoredPaths } from './get-gitignored-paths';

describe('getGitIgnoredPaths', () => {
  const mockEnv = (
    pwd: string,
    gitignorePath: string | null,
    gitignoreContent: string = '',
  ): CommandLineEnvironmentInterface =>
    ({
      name: 'mock-env',
      runCommand: vi.fn().mockImplementation(async (command: string) => {
        if (command.includes('pwd')) {
          return { command, exitCode: 0, stdout: pwd, stderr: '' };
        }
        if (command.includes('while')) {
          return {
            command,
            exitCode: 0,
            stdout: gitignorePath || '',
            stderr: '',
          };
        }
        if (command.startsWith('cat ')) {
          if (gitignorePath && command.includes(gitignorePath)) {
            return {
              command,
              exitCode: 0,
              stdout: gitignoreContent,
              stderr: '',
            };
          }
          return { command, exitCode: 1, stdout: '', stderr: 'File not found' };
        }
        return { command, exitCode: 0, stdout: '', stderr: '' };
      }),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      deleteFile: vi.fn(),
      moveFile: vi.fn(),
      copyFile: vi.fn(),
    }) as unknown as CommandLineEnvironmentInterface;

  it('should return empty array if no .gitignore is found', async () => {
    const env = mockEnv('/project', null);
    const result = await getGitIgnoredPaths(env);
    expect(result).toEqual([]);
  });

  it('should return rules from .gitignore in current directory', async () => {
    const content = `
      node_modules/
      *.log
      # comment
      /dist
    `;
    const env = mockEnv('/project', '/project/.gitignore', content);
    const result = await getGitIgnoredPaths(env);
    expect(result).toEqual(['node_modules/', '*.log', 'dist']);
  });

  it('should sanitize anchored rules from parent .gitignore', async () => {
    const content = `
      /packages/*/coverage
      /packages/env-utils/test.log
      /other/path
    `;
    const env = mockEnv(
      '/project/packages/env-utils',
      '/project/.gitignore',
      content,
    );
    const result = await getGitIgnoredPaths(env);
    expect(result).toEqual(['coverage', 'test.log']);
  });

  it('should return "." if the entire current directory is ignored', async () => {
    const content = '/packages/';
    const env = mockEnv(
      '/project/packages/env-utils',
      '/project/.gitignore',
      content,
    );
    const result = await getGitIgnoredPaths(env);
    expect(result).toEqual(['.']);
  });

  it('should handle non-anchored rules from parent .gitignore', async () => {
    const content = 'node_modules/';
    const env = mockEnv(
      '/project/packages/env-utils',
      '/project/.gitignore',
      content,
    );
    const result = await getGitIgnoredPaths(env);
    expect(result).toEqual(['node_modules/']);
  });

  it('should handle **/ rules by removing the prefix', async () => {
    const content = '**/temp';
    const env = mockEnv(
      '/project/packages/env-utils',
      '/project/.gitignore',
      content,
    );
    const result = await getGitIgnoredPaths(env);
    expect(result).toEqual(['temp']);
  });

  it('should handle complex wildcard matching', async () => {
    const content = `
      /packages/env-*/dist
      /packages/env-utils/*.tmp
    `;
    const env = mockEnv(
      '/project/packages/env-utils',
      '/project/.gitignore',
      content,
    );
    const result = await getGitIgnoredPaths(env);
    expect(result).toEqual(['dist', '*.tmp']);
  });

  it('should preserve trailing slash in sanitized rules', async () => {
    const content = '/packages/env-utils/dist/';
    const env = mockEnv(
      '/project/packages/env-utils',
      '/project/.gitignore',
      content,
    );
    const result = await getGitIgnoredPaths(env);
    expect(result).toEqual(['dist/']);
  });

  it('should return empty array if cat fails', async () => {
    const env = {
      name: 'mock-env',
      runCommand: vi.fn().mockImplementation(async (command: string) => {
        if (command.includes('while')) {
          return {
            command,
            exitCode: 0,
            stdout: '/project/.gitignore',
            stderr: '',
          };
        }
        if (command.startsWith('cat ')) {
          return { command, exitCode: 1, stdout: '', stderr: 'Error' };
        }
        return { command, exitCode: 0, stdout: '', stderr: '' };
      }),
    } as unknown as CommandLineEnvironmentInterface;

    const result = await getGitIgnoredPaths(env);
    expect(result).toEqual([]);
  });
});
