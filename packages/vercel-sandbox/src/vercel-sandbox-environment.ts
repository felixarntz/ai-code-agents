import { Sandbox } from '@vercel/sandbox';
import {
  UnixEnvironmentBase,
  type ShutdownableEnvironmentInterface,
} from '@ai-code-agents/environment-utils';

export type VercelSandboxCreateOptions = Exclude<
  Parameters<typeof Sandbox.create>[0],
  undefined
>;

/**
 * Configuration options for VercelSandboxEnvironment constructor.
 *
 * Requires an existing Vercel Sandbox instance. Use the static `create()`
 * method if you want the environment to create a sandbox for you.
 */
export type VercelSandboxEnvironmentConfig = {
  /**
   * An existing Vercel Sandbox instance to use.
   */
  sandbox: Sandbox;

  /**
   * The working directory path within the sandbox.
   * Defaults to `/vercel/sandbox`.
   */
  directoryPath?: string;

  /**
   * Environment variables to set when running commands.
   */
  env?: Record<string, string>;
};

/**
 * Options for the static `VercelSandboxEnvironment.create()` factory method.
 */
export type VercelSandboxEnvironmentCreateFactoryOptions = {
  /**
   * Options for creating a new Vercel Sandbox.
   * Defaults to an empty object.
   */
  createOptions?: VercelSandboxCreateOptions;

  /**
   * The working directory path within the sandbox.
   * Defaults to `/vercel/sandbox`.
   */
  directoryPath?: string;

  /**
   * Environment variables to set when running commands.
   */
  env?: Record<string, string>;
};

export const VercelSandboxEnvironmentName = 'vercel-sandbox';

/**
 * An execution environment using Vercel Sandbox for isolated code execution.
 *
 * This environment leverages Vercel's Sandbox service to run commands in
 * isolated, ephemeral Linux VMs powered by Firecracker MicroVMs.
 *
 * Authentication requires one of:
 * - `VERCEL_OIDC_TOKEN` environment variable (recommended, via `vercel env pull`)
 * - `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`, and `VERCEL_TOKEN` environment variables
 *
 * @example Using an existing sandbox instance (constructor)
 * ```typescript
 * import { Sandbox } from '@vercel/sandbox';
 * import { VercelSandboxEnvironment } from '@ai-code-agents/vercel-sandbox';
 *
 * const sandbox = await Sandbox.create({ runtime: 'node22' });
 * const env = new VercelSandboxEnvironment({ sandbox });
 *
 * const result = await env.runCommand('echo "Hello"');
 * console.log(result.stdout); // "Hello\n"
 *
 * await env.shutdown();
 * ```
 *
 * @example Creating a sandbox automatically (static factory)
 * ```typescript
 * import { VercelSandboxEnvironment } from '@ai-code-agents/vercel-sandbox';
 *
 * const env = await VercelSandboxEnvironment.create({
 *   createOptions: { runtime: 'node22', resources: { vcpus: 2 } },
 * });
 *
 * const result = await env.runCommand('node --version');
 * console.log(result.stdout);
 *
 * await env.shutdown(); // Stops the sandbox since env owns it.
 * ```
 */
export class VercelSandboxEnvironment
  extends UnixEnvironmentBase<VercelSandboxEnvironmentConfig>
  implements ShutdownableEnvironmentInterface
{
  private readonly _sandbox: Sandbox;

  /**
   * Creates a new VercelSandboxEnvironment by creating a new Vercel Sandbox.
   *
   * The environment will own the sandbox, so `shutdown()` will stop it.
   *
   * @param options - Options including `createOptions` for the sandbox.
   * @returns A promise that resolves to the new environment instance.
   */
  static async create(
    options: VercelSandboxEnvironmentCreateFactoryOptions = {},
  ): Promise<VercelSandboxEnvironment> {
    const { createOptions = {}, directoryPath, env } = options;
    const sandbox = await Sandbox.create(createOptions);
    return new VercelSandboxEnvironment({
      sandbox,
      directoryPath,
      env,
    });
  }

  /**
   * Constructs a new VercelSandboxEnvironment instance with an existing sandbox.
   *
   * Use the static `create()` method if you want the environment to create
   * a sandbox for you.
   *
   * @param config - Environment configuration with an existing sandbox.
   */
  constructor(config: VercelSandboxEnvironmentConfig) {
    super(config);
    this._sandbox = config.sandbox;
  }

  /**
   * Gets the environment name.
   *
   * @returns The environment name.
   */
  get name(): string {
    return VercelSandboxEnvironmentName;
  }

  /**
   * Shuts down the environment and stops the sandbox.
   *
   * @returns A promise that resolves when shutdown is complete.
   */
  async shutdown(): Promise<void> {
    await this._sandbox.stop();
  }

  /**
   * Executes a command in the Vercel Sandbox environment.
   *
   * The command is executed using `sh -c` to support shell features like
   * pipes, redirects, and variable expansion.
   *
   * @param command - The command to execute.
   * @returns A promise that resolves to a tuple containing the exit code, stdout, and stderr.
   */
  protected async executeCommand(
    command: string,
  ): Promise<[number, string, string]> {
    const { directoryPath, env } = this._envConfig;

    const result = await this._sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', command],
      ...(directoryPath ? { cwd: directoryPath } : {}),
      ...(env ? { env } : {}),
    });

    const stdout = await result.stdout();
    const stderr = await result.stderr();

    return [result.exitCode, stdout, stderr];
  }
}
