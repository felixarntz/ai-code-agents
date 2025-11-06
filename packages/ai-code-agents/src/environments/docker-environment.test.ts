import {
  exec,
  type ChildProcess,
  type ExecException,
  type ExecOptions,
} from 'node:child_process';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DockerEnvironment } from './docker-environment';

vi.mock('node:child_process');

type ExecCallback = (
  error: ExecException | null,
  stdout: string,
  stderr: string,
) => void;

/**
 * Creates a default test environment for DockerEnvironment tests.
 *
 * @returns A new DockerEnvironment instance with default container ID.
 */
function createDefaultTestEnvironment(): DockerEnvironment {
  return new DockerEnvironment({ containerId: 'test-container' });
}

describe('DockerEnvironment', () => {
  const containerId = 'test-container';

  beforeEach(() => {
    vi.mocked(exec).mockClear();
  });

  it('should execute a command in the specified docker container', async () => {
    const command = 'ls -l';
    const expectedDockerCommand = `docker exec ${containerId} sh -c "${command}"`;
    const expectedStdout = 'total 0';
    const expectedStderr = '';
    const expectedExitCode = 0;

    vi.mocked(exec).mockImplementation(
      (
        command: string,
        options: ExecOptions | ExecCallback | null | undefined,
        callback: ExecCallback | null | undefined,
      ): ChildProcess => {
        expect(command).toBe(expectedDockerCommand);
        const cb = typeof options === 'function' ? options : callback;
        if (cb) {
          cb(null, expectedStdout, expectedStderr);
        }
        return {} as ChildProcess;
      },
    );

    const { exitCode, stdout, stderr } =
      await createDefaultTestEnvironment().runCommand(command);

    expect(exitCode).toBe(expectedExitCode);
    expect(stdout).toBe(expectedStdout);
    expect(stderr).toBe(expectedStderr);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('should handle command execution errors', async () => {
    const command = 'cat non_existent_file';
    const expectedDockerCommand = `docker exec ${containerId} sh -c "${command}"`;
    const expectedError = new Error('Command failed');
    (expectedError as ExecException).code = 1;
    const expectedStdout = '';
    const expectedStderr = 'cat: non_existent_file: No such file or directory';

    vi.mocked(exec).mockImplementation(
      (
        command: string,
        options: ExecOptions | ExecCallback | null | undefined,
        callback: ExecCallback | null | undefined,
      ): ChildProcess => {
        expect(command).toBe(expectedDockerCommand);
        const cb = typeof options === 'function' ? options : callback;
        if (cb) {
          cb(expectedError, expectedStdout, expectedStderr);
        }
        return {} as ChildProcess;
      },
    );

    const { exitCode, stdout, stderr } =
      await createDefaultTestEnvironment().runCommand(command);

    expect(exitCode).toBe(1);
    expect(stdout).toBe(expectedStdout);
    expect(stderr).toBe(expectedStderr);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('should resolve with exit code 1 if error code is not available', async () => {
    const command = 'some_failing_command';
    const expectedDockerCommand = `docker exec ${containerId} sh -c "${command}"`;
    const expectedError = new Error('Command failed');
    const expectedStdout = '';
    const expectedStderr = 'An unexpected error occurred';

    vi.mocked(exec).mockImplementation(
      (
        command: string,
        options: ExecOptions | ExecCallback | null | undefined,
        callback: ExecCallback | null | undefined,
      ): ChildProcess => {
        expect(command).toBe(expectedDockerCommand);
        const cb = typeof options === 'function' ? options : callback;
        if (cb) {
          cb(expectedError, expectedStdout, expectedStderr);
        }
        return {} as ChildProcess;
      },
    );

    const { exitCode, stdout, stderr } =
      await createDefaultTestEnvironment().runCommand(command);

    expect(exitCode).toBe(1);
    expect(stdout).toBe(expectedStdout);
    expect(stderr).toBe(expectedStderr);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('should execute a command in the specified directory within the docker container', async () => {
    const directoryPath = '/app';
    const command = 'ls -l';
    const expectedDockerCommand = `docker exec ${containerId} sh -c "cd '${directoryPath}' && ${command}"`;
    const expectedStdout = 'total 0';
    const expectedStderr = '';
    const expectedExitCode = 0;

    const environmentWithDir = new DockerEnvironment({
      containerId,
      directoryPath,
    });

    vi.mocked(exec).mockImplementation(
      (
        command: string,
        options: ExecOptions | ExecCallback | null | undefined,
        callback: ExecCallback | null | undefined,
      ): ChildProcess => {
        expect(command).toBe(expectedDockerCommand);
        const cb = typeof options === 'function' ? options : callback;
        if (cb) {
          cb(null, expectedStdout, expectedStderr);
        }
        return {} as ChildProcess;
      },
    );

    const { exitCode, stdout, stderr } =
      await environmentWithDir.runCommand(command);

    expect(exitCode).toBe(expectedExitCode);
    expect(stdout).toBe(expectedStdout);
    expect(stderr).toBe(expectedStderr);
    expect(exec).toHaveBeenCalledTimes(1);
  });
});
