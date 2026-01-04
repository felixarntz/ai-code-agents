import { exec } from 'node:child_process';
import { UnixEnvironmentBase, escapeCommandArg } from '@ai-code-agents/environment-utils';

export type UnsafeLocalEnvironmentConfig = {
  directoryPath: string;
};

export const UnsafeLocalEnvironmentName = 'unsafe-local';

/**
 * A local command line execution environment in a specific directory, without any safety mechanisms.
 *
 * WARNING: This environment is unsafe because it allows unrestricted access to
 * the local file system and command line. It should only be used in controlled
 * environments where security is not a concern.
 */
export class UnsafeLocalEnvironment extends UnixEnvironmentBase<UnsafeLocalEnvironmentConfig> {
  protected readonly _commandPrefix: string;

  /**
   * Constructs a new environment instance.
   *
   * @param config - Environment configuration.
   */
  constructor(config: UnsafeLocalEnvironmentConfig) {
    const { directoryPath } = config;
    if (!directoryPath) {
      throw new Error('The directory path must be provided');
    }
    if (!directoryPath.startsWith('/')) {
      throw new Error('The directory path must be absolute (start with "/")');
    }

    super(config);

    this._commandPrefix = `cd ${escapeCommandArg(directoryPath)} && `;
  }

  /**
   * Gets the environment name.
   *
   * @returns The environment name.
   */
  get name(): string {
    return UnsafeLocalEnvironmentName;
  }

  /**
   * Executes a command in the environment and returns the exit code, stdout, and stderr.
   *
   * @param command - The command to execute.
   * @returns A promise that resolves to a tuple containing the exit code, stdout, and stderr.
   */
  protected async executeCommand(
    command: string,
  ): Promise<[number, string, string]> {
    return new Promise((resolve) => {
      exec(`${this._commandPrefix}${command}`, (error, stdout, stderr) => {
        const exitCode = error ? (error.code ?? 1) : 0;
        resolve([exitCode, stdout, stderr]);
      });
    });
  }
}
