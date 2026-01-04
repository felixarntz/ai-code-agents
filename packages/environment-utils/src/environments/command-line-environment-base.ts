import type {
  CommandLineEnvironmentInterface,
  RunCommandResult,
} from '../types';
import { FilesystemEnvironmentBase } from './filesystem-environment-base';

/**
 * Base class for a command-line based execution environment.
 */
export abstract class CommandLineEnvironmentBase<EnvironmentConfig>
  extends FilesystemEnvironmentBase<EnvironmentConfig>
  implements CommandLineEnvironmentInterface
{
  /**
   * Runs a CLI command in environment.
   *
   * @param command - The command to run.
   * @returns A promise that resolves to a RunCommandResult.
   */
  async runCommand(command: string): Promise<RunCommandResult> {
    const [exitCode, stdout, stderr] = await this.executeCommand(command);
    return {
      command,
      exitCode,
      stdout,
      stderr,
    };
  }

  /**
   * Executes a command in the environment and returns the exit code, stdout, and stderr.
   *
   * @param command - The command to execute.
   * @returns A promise that resolves to a tuple containing the exit code, stdout, and stderr.
   */
  protected abstract executeCommand(
    command: string,
  ): Promise<[number, string, string]>;
}
