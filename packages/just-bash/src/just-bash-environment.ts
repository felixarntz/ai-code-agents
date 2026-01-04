import { Bash } from 'just-bash';
import { UnixEnvironmentBase } from '@ai-code-agents/environment-utils';

export type JustBashEnvironmentConfig = {
  initialFiles?: Record<string, string>;
  directoryPath?: string;
  env?: Record<string, string>;
};

export const JustBashEnvironmentName = 'just-bash';

/**
 * A simulated bash execution environment using the "just-bash" TypeScript implementation.
 */
export class JustBashEnvironment extends UnixEnvironmentBase<JustBashEnvironmentConfig> {
  protected readonly _bash: Bash;

  /**
   * Constructs a new environment instance.
   *
   * @param config - Environment configuration.
   */
  constructor(config: JustBashEnvironmentConfig = {}) {
    super(config);

    const { initialFiles, directoryPath, env } = this._envConfig;

    this._bash = new Bash({
      files: initialFiles,
      ...(directoryPath ? { cwd: directoryPath } : {}),
      env,
    });
  }

  /**
   * Gets the environment name.
   *
   * @returns The environment name.
   */
  get name(): string {
    return JustBashEnvironmentName;
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
    const result = await this._bash.exec(command);
    return [result.exitCode, result.stdout, result.stderr];
  }
}
