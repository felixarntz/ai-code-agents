import { exec } from 'node:child_process';
import { escapeCommandArg } from '../util/escape-command-arg';
import { UnixEnvironmentBase } from './unix-environment-base';

export type DockerEnvironmentConfig = {
  containerId: string;
  directoryPath?: string;
};

export const DockerEnvironmentName = 'docker';

/**
 * A Docker-based execution environment that interacts with a specified Docker container.
 */
export class DockerEnvironment extends UnixEnvironmentBase<DockerEnvironmentConfig> {
  protected readonly _commandPrefix: string;

  /**
   * Constructs a new environment instance.
   *
   * @param config - Environment configuration.
   */
  constructor(config: DockerEnvironmentConfig) {
    super(config);

    const { directoryPath } = this._envConfig;
    this._commandPrefix = directoryPath
      ? `cd ${escapeCommandArg(directoryPath)} && `
      : '';
  }

  /**
   * Gets the environment name.
   *
   * @returns The environment name.
   */
  get name(): string {
    return DockerEnvironmentName;
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
      exec(
        `docker exec ${this._envConfig.containerId} ${this._commandPrefix}${command}`,
        (error, stdout, stderr) => {
          const exitCode = error ? (error.code ?? 1) : 0;
          resolve([exitCode, stdout, stderr]);
        },
      );
    });
  }
}
