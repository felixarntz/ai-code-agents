import { Bash, type BashOptions } from 'just-bash';
import { UnixEnvironmentBase } from '@ai-code-agents/environment-utils';

/**
 * Configuration options for JustBashEnvironment constructor.
 *
 * Requires an existing Bash instance. Use the static `create()`
 * method if you want the environment to create a Bash instance for you.
 */
export type JustBashEnvironmentConfig = {
  /**
   * An existing Bash instance to use.
   */
  bash: Bash;

  /**
   * The working directory path within the environment.
   * Applied per-execution via the exec options.
   */
  directoryPath?: string;

  /**
   * Environment variables to set when running commands.
   * Applied per-execution via the exec options.
   */
  env?: Record<string, string>;
};

/**
 * Options for the static `JustBashEnvironment.create()` factory method.
 */
export type JustBashEnvironmentCreateFactoryOptions = {
  /**
   * Options for creating a new Bash instance.
   * Defaults to an empty object.
   */
  bashOptions?: BashOptions;

  /**
   * The working directory path within the environment.
   * Merged into bashOptions.cwd and applied per-execution.
   */
  directoryPath?: string;

  /**
   * Environment variables to set when running commands.
   * Merged into bashOptions.env and applied per-execution.
   */
  env?: Record<string, string>;
};

export const JustBashEnvironmentName = 'just-bash';

/**
 * A simulated bash execution environment using the "just-bash" TypeScript implementation.
 *
 * This environment provides an in-memory virtual filesystem and bash shell
 * for isolated code execution without requiring external processes or containers.
 *
 * @example Using an existing Bash instance (constructor)
 * ```typescript
 * import { Bash } from 'just-bash';
 * import { JustBashEnvironment } from '@ai-code-agents/just-bash';
 *
 * const bash = new Bash({ files: { '/app/data.txt': 'hello' } });
 * const env = new JustBashEnvironment({ bash, directoryPath: '/app' });
 *
 * const result = await env.runCommand('cat data.txt');
 * console.log(result.stdout); // "hello"
 * ```
 *
 * @example Creating a Bash instance automatically (static factory)
 * ```typescript
 * import { JustBashEnvironment } from '@ai-code-agents/just-bash';
 *
 * const env = JustBashEnvironment.create({
 *   bashOptions: { files: { '/app/script.sh': 'echo "Hello"' } },
 *   directoryPath: '/app',
 * });
 *
 * const result = await env.runCommand('bash script.sh');
 * console.log(result.stdout); // "Hello\n"
 * ```
 */
export class JustBashEnvironment extends UnixEnvironmentBase<JustBashEnvironmentConfig> {
  protected readonly _bash: Bash;

  /**
   * Creates a new JustBashEnvironment by creating a new Bash instance.
   *
   * @param options - Options including `bashOptions` for the Bash instance.
   * @returns The new environment instance.
   */
  static create(
    options: JustBashEnvironmentCreateFactoryOptions = {},
  ): JustBashEnvironment {
    const { bashOptions = {}, directoryPath, env } = options;
    const bash = new Bash({
      ...bashOptions,
      ...(directoryPath ? { cwd: directoryPath } : {}),
      ...(env ? { env: { ...bashOptions.env, ...env } } : {}),
    });
    return new JustBashEnvironment({
      bash,
      directoryPath,
      env,
    });
  }

  /**
   * Constructs a new JustBashEnvironment instance with an existing Bash instance.
   *
   * Use the static `create()` method if you want the environment to create
   * a Bash instance for you.
   *
   * @param config - Environment configuration with an existing Bash instance.
   */
  constructor(config: JustBashEnvironmentConfig) {
    super(config);
    this._bash = config.bash;
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
    const { directoryPath, env } = this._envConfig;

    const result = await this._bash.exec(command, {
      ...(directoryPath ? { cwd: directoryPath } : {}),
      ...(env ? { env } : {}),
    });

    return [result.exitCode, result.stdout, result.stderr];
  }
}
