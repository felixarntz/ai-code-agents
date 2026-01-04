import { escapeCommandArg } from '../util/escape-command-arg';
import { CommandLineEnvironmentBase } from './command-line-environment-base';

/**
 * Base class for a Unix-like command line execution environment.
 */
export abstract class UnixEnvironmentBase<
  EnvironmentConfig,
> extends CommandLineEnvironmentBase<EnvironmentConfig> {
  /**
   * Checks whether a file exists at the specified path relative to the project directory.
   *
   * @param relativePath - The path to the file to check, relative to the project directory.
   * @returns True if the file exists, false otherwise.
   */
  protected async fileExists(relativePath: string): Promise<boolean> {
    const command = `if [ -e ${escapeCommandArg(relativePath)} ]; then echo "yes"; else echo "no"; fi`;
    const { exitCode, stdout } = await this.runCommand(command);
    return exitCode === 0 && stdout.trim() === 'yes';
  }

  /**
   * Gets the content of a file at the specified path, relative to the project directory.
   *
   * When this method is called, it is guaranteed that the file exists.
   *
   * @param relativePath - The path to the file to read, relative to the project directory.
   * @returns The content of the file.
   */
  protected async readFileContent(relativePath: string): Promise<string> {
    const command = `cat ${escapeCommandArg(relativePath)}`;
    const { exitCode, stdout } = await this.runCommand(command);
    return exitCode === 0 ? stdout : '';
  }

  /**
   * Writes content to a file at the specified path, relative to the project directory.
   *
   * This method unconditionally writes the content, even if a file already exists at the path, or if the file is new.
   *
   * @param relativePath - The path to the file to write, relative to the project directory.
   * @param content - The content to write to the file.
   */
  protected async writeFileContent(
    relativePath: string,
    content: string,
  ): Promise<void> {
    const command = `sh -c "echo ${escapeCommandArg(
      content,
    )} > ${escapeCommandArg(relativePath)}"`;
    const { exitCode, stderr } = await this.runCommand(command);
    if (exitCode !== 0) {
      throw new Error(`Failed to write file: ${stderr || 'Unknown error'}`);
    }
  }

  /**
   * Deletes a file at the specified path, relative to the project directory.
   *
   * When this method is called, it is guaranteed that the file exists.
   *
   * @param relativePath - The path to the file to delete, relative to the project directory.
   */
  protected async deleteFileContent(relativePath: string): Promise<void> {
    const command = `rm ${escapeCommandArg(relativePath)}`;
    const { exitCode, stderr } = await this.runCommand(command);
    if (exitCode !== 0) {
      throw new Error(`Failed to delete file: ${stderr || 'Unknown error'}`);
    }
  }

  /**
   * Moves the content of a file from a source path to a destination path, relative to the project directory.
   *
   * When this method is called, it is guaranteed that the source file exists.
   * This method unconditionally moves the content, even if a file already exists at the destination path.
   *
   * @param relativeSourcePath - The path to the file to move, relative to the project directory.
   * @param relativeDestinationPath - The path to move the file to, relative to the project directory.
   */
  protected override async moveFileContent(
    relativeSourcePath: string,
    relativeDestinationPath: string,
  ): Promise<void> {
    const command = `mv ${escapeCommandArg(relativeSourcePath)} ${escapeCommandArg(
      relativeDestinationPath,
    )}`;
    const { exitCode, stderr } = await this.runCommand(command);
    if (exitCode !== 0) {
      throw new Error(`Failed to move file: ${stderr || 'Unknown error'}`);
    }
  }

  /**
   * Copies the content of a file from a source path to a destination path, relative to the project directory.
   *
   * When this method is called, it is guaranteed that the source file exists.
   * This method unconditionally copies the content, even if a file already exists at the destination path.
   *
   * @param relativeSourcePath - The path to the file to copy, relative to the project directory.
   * @param relativeDestinationPath - The path to copy the file to, relative to the project directory.
   */
  protected override async copyFileContent(
    relativeSourcePath: string,
    relativeDestinationPath: string,
  ): Promise<void> {
    const command = `cp ${escapeCommandArg(relativeSourcePath)} ${escapeCommandArg(
      relativeDestinationPath,
    )}`;
    const result = await this.runCommand(command);
    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to copy file: ${result.stderr || 'Unknown error'}`,
      );
    }
  }
}
