import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  VercelSandboxEnvironment,
  VercelSandboxEnvironmentName,
} from './vercel-sandbox-environment';

/**
 * Options for creating a mock Sandbox instance.
 */
interface MockSandboxOptions {
  /** The exit code to return from commands. */
  exitCode?: number;
  /** The stdout content to return from commands. */
  stdout?: string;
  /** The stderr content to return from commands. */
  stderr?: string;
}

/**
 * Creates a mock Sandbox instance with configurable behavior.
 *
 * @param options - Options for configuring mock behavior.
 * @returns A mock Sandbox object.
 */
function createMockSandbox(options: MockSandboxOptions = {}) {
  const { exitCode = 0, stdout = '', stderr = '' } = options;

  return {
    runCommand: vi.fn().mockResolvedValue({
      exitCode,
      stdout: vi.fn().mockResolvedValue(stdout),
      stderr: vi.fn().mockResolvedValue(stderr),
    }),
    stop: vi.fn().mockResolvedValue(undefined),
  };
}

// Mock the @vercel/sandbox module.
vi.mock('@vercel/sandbox', () => ({
  Sandbox: {
    create: vi.fn(),
  },
}));

describe('VercelSandboxEnvironment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('name', () => {
    it('should return the correct environment name', () => {
      const mockSandbox = createMockSandbox();
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
      });
      expect(env.name).toBe(VercelSandboxEnvironmentName);
      expect(env.name).toBe('vercel-sandbox');
    });
  });

  describe('constructor', () => {
    it('should create an environment with sandbox instance', () => {
      const mockSandbox = createMockSandbox();
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
      });
      expect(env.name).toBe('vercel-sandbox');
    });

    it('should create an environment with custom directory path', () => {
      const mockSandbox = createMockSandbox();
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
        directoryPath: '/app',
      });
      expect(env.name).toBe('vercel-sandbox');
    });

    it('should create an environment with custom environment variables', () => {
      const mockSandbox = createMockSandbox();
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
        env: { MY_VAR: 'my_value', ANOTHER_VAR: '123' },
      });
      expect(env.name).toBe('vercel-sandbox');
    });
  });

  describe('static create', () => {
    it('should create sandbox with default options', async () => {
      const mockSandbox = createMockSandbox();
      const { Sandbox } = await import('@vercel/sandbox');
      vi.mocked(Sandbox.create).mockResolvedValue(mockSandbox as never);

      const env = await VercelSandboxEnvironment.create();

      expect(Sandbox.create).toHaveBeenCalledWith({});
      expect(env.name).toBe('vercel-sandbox');
    });

    it('should create sandbox with custom createOptions', async () => {
      const mockSandbox = createMockSandbox();
      const { Sandbox } = await import('@vercel/sandbox');
      vi.mocked(Sandbox.create).mockResolvedValue(mockSandbox as never);

      const createOptions = {
        runtime: 'node22' as const,
        resources: { vcpus: 2 },
      };
      const env = await VercelSandboxEnvironment.create({ createOptions });

      expect(Sandbox.create).toHaveBeenCalledWith(createOptions);
      expect(env.name).toBe('vercel-sandbox');
    });

    it('should pass directoryPath and env to the created environment', async () => {
      const mockSandbox = createMockSandbox();
      const { Sandbox } = await import('@vercel/sandbox');
      vi.mocked(Sandbox.create).mockResolvedValue(mockSandbox as never);

      const env = await VercelSandboxEnvironment.create({
        directoryPath: '/app/src',
        env: { MY_VAR: 'value' },
      });

      // Verify by running a command which should use these options.
      await env.runCommand('pwd');

      expect(mockSandbox.runCommand).toHaveBeenCalledWith({
        cmd: 'sh',
        args: ['-c', 'pwd'],
        cwd: '/app/src',
        env: { MY_VAR: 'value' },
      });
    });
  });

  describe('shutdown', () => {
    it('should stop sandbox when created via create()', async () => {
      const mockSandbox = createMockSandbox();
      const { Sandbox } = await import('@vercel/sandbox');
      vi.mocked(Sandbox.create).mockResolvedValue(mockSandbox as never);

      const env = await VercelSandboxEnvironment.create();
      await env.shutdown();

      expect(mockSandbox.stop).toHaveBeenCalledTimes(1);
    });

    it('should stop sandbox when created via constructor', async () => {
      const mockSandbox = createMockSandbox();
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
      });

      await env.shutdown();

      expect(mockSandbox.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('runCommand', () => {
    it('should execute a simple command', async () => {
      const mockSandbox = createMockSandbox({
        exitCode: 0,
        stdout: 'Hello\n',
        stderr: '',
      });
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
      });

      const result = await env.runCommand('echo "Hello"');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('Hello\n');
      expect(result.stderr).toBe('');
      expect(result.command).toBe('echo "Hello"');
    });

    it('should pass command to sh -c', async () => {
      const mockSandbox = createMockSandbox();
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
      });

      await env.runCommand('echo "test" | grep test');

      expect(mockSandbox.runCommand).toHaveBeenCalledWith({
        cmd: 'sh',
        args: ['-c', 'echo "test" | grep test'],
      });
    });

    it('should pass custom directory path to command', async () => {
      const mockSandbox = createMockSandbox();
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
        directoryPath: '/app/src',
      });

      await env.runCommand('pwd');

      expect(mockSandbox.runCommand).toHaveBeenCalledWith({
        cmd: 'sh',
        args: ['-c', 'pwd'],
        cwd: '/app/src',
      });
    });

    it('should pass custom environment variables to command', async () => {
      const mockSandbox = createMockSandbox();
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
        env: { MY_VAR: 'value', ANOTHER: '123' },
      });

      await env.runCommand('echo $MY_VAR');

      expect(mockSandbox.runCommand).toHaveBeenCalledWith({
        cmd: 'sh',
        args: ['-c', 'echo $MY_VAR'],
        env: { MY_VAR: 'value', ANOTHER: '123' },
      });
    });

    it('should handle non-zero exit code', async () => {
      const mockSandbox = createMockSandbox({
        exitCode: 1,
        stdout: '',
        stderr: 'command failed',
      });
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
      });

      const result = await env.runCommand('false');

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toBe('command failed');
    });

    it('should handle command with stderr output', async () => {
      const mockSandbox = createMockSandbox({
        exitCode: 0,
        stdout: '',
        stderr: 'warning message\n',
      });
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
      });

      const result = await env.runCommand('some-command');

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('warning message\n');
    });

    it('should handle command with both stdout and stderr', async () => {
      const mockSandbox = createMockSandbox({
        exitCode: 0,
        stdout: 'output line\n',
        stderr: 'error line\n',
      });
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
      });

      const result = await env.runCommand('mixed-output');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('output line\n');
      expect(result.stderr).toBe('error line\n');
    });
  });

  describe('file operations via inherited methods', () => {
    it('should read a file via cat command', async () => {
      const mockSandbox = createMockSandbox({
        exitCode: 0,
        stdout: 'file content',
        stderr: '',
      });
      // Mock fileExists check first.
      mockSandbox.runCommand
        .mockResolvedValueOnce({
          exitCode: 0,
          stdout: vi.fn().mockResolvedValue('yes\n'),
          stderr: vi.fn().mockResolvedValue(''),
        })
        .mockResolvedValueOnce({
          exitCode: 0,
          stdout: vi.fn().mockResolvedValue('file content'),
          stderr: vi.fn().mockResolvedValue(''),
        });

      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
        directoryPath: '/home/user',
      });

      const result = await env.readFile('test.txt');
      expect(result.content).toBe('file content');
    });

    it('should throw error when reading non-existent file', async () => {
      const mockSandbox = createMockSandbox();
      // Mock fileExists check to return 'no'.
      mockSandbox.runCommand.mockResolvedValueOnce({
        exitCode: 0,
        stdout: vi.fn().mockResolvedValue('no\n'),
        stderr: vi.fn().mockResolvedValue(''),
      });

      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
        directoryPath: '/home/user',
      });

      await expect(env.readFile('nonexistent.txt')).rejects.toThrow(
        'File not found: nonexistent.txt',
      );
    });

    it('should write a file via echo command', async () => {
      const mockSandbox = createMockSandbox();
      // Mock the write operation.
      mockSandbox.runCommand.mockResolvedValue({
        exitCode: 0,
        stdout: vi.fn().mockResolvedValue(''),
        stderr: vi.fn().mockResolvedValue(''),
      });

      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
        directoryPath: '/home/user',
      });

      const result = await env.writeFile('newfile.txt', 'new content');
      expect(result.path).toBe('newfile.txt');
      expect(result.message).toContain('written');
    });

    it('should delete a file via rm command', async () => {
      const mockSandbox = createMockSandbox();
      // Mock fileExists check to return 'yes', then the delete operation.
      mockSandbox.runCommand
        .mockResolvedValueOnce({
          exitCode: 0,
          stdout: vi.fn().mockResolvedValue('yes\n'),
          stderr: vi.fn().mockResolvedValue(''),
        })
        .mockResolvedValueOnce({
          exitCode: 0,
          stdout: vi.fn().mockResolvedValue(''),
          stderr: vi.fn().mockResolvedValue(''),
        });

      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
        directoryPath: '/home/user',
      });

      const result = await env.deleteFile('todelete.txt');
      expect(result.path).toBe('todelete.txt');
      expect(result.message).toContain('deleted');
    });
  });

  describe('lifecycle integration', () => {
    it('should support full lifecycle: create -> commands -> shutdown', async () => {
      const mockSandbox = createMockSandbox({
        exitCode: 0,
        stdout: 'Hello World\n',
        stderr: '',
      });
      const { Sandbox } = await import('@vercel/sandbox');
      vi.mocked(Sandbox.create).mockResolvedValue(mockSandbox as never);

      // Create via static factory.
      const env = await VercelSandboxEnvironment.create({
        createOptions: { runtime: 'node22' as const, resources: { vcpus: 2 } },
      });
      expect(Sandbox.create).toHaveBeenCalledWith({
        runtime: 'node22',
        resources: { vcpus: 2 },
      });

      // Run command.
      const result = await env.runCommand('echo "Hello World"');
      expect(result.stdout).toBe('Hello World\n');

      // Shutdown.
      await env.shutdown();
      expect(mockSandbox.stop).toHaveBeenCalled();
    });

    it('should work with constructor for pre-existing sandbox', async () => {
      const mockSandbox = createMockSandbox({
        exitCode: 0,
        stdout: 'test output\n',
        stderr: '',
      });

      // Create via constructor with existing sandbox.
      const env = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
        directoryPath: '/workspace',
      });

      // Run command.
      const result = await env.runCommand('echo test');
      expect(result.stdout).toBe('test output\n');
      expect(mockSandbox.runCommand).toHaveBeenCalledWith({
        cmd: 'sh',
        args: ['-c', 'echo test'],
        cwd: '/workspace',
      });

      // Shutdown stops the sandbox.
      await env.shutdown();
      expect(mockSandbox.stop).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple environments to share a sandbox', async () => {
      const mockSandbox = createMockSandbox({
        exitCode: 0,
        stdout: 'output\n',
        stderr: '',
      });

      const env1 = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
        directoryPath: '/app1',
      });

      const env2 = new VercelSandboxEnvironment({
        sandbox: mockSandbox as never,
        directoryPath: '/app2',
      });

      // Both can run commands.
      await env1.runCommand('pwd');
      await env2.runCommand('pwd');

      expect(mockSandbox.runCommand).toHaveBeenCalledTimes(2);
      expect(mockSandbox.runCommand).toHaveBeenNthCalledWith(1, {
        cmd: 'sh',
        args: ['-c', 'pwd'],
        cwd: '/app1',
      });
      expect(mockSandbox.runCommand).toHaveBeenNthCalledWith(2, {
        cmd: 'sh',
        args: ['-c', 'pwd'],
        cwd: '/app2',
      });

      // Note: With shared sandboxes, only call shutdown() once when done.
      // Each shutdown() call will stop the sandbox.
    });
  });
});
