import fs from 'node:fs/promises';
import path from 'node:path';
import { FilesystemEnvironmentBase } from './filesystem-environment-base';

export type NodeFilesystemEnvironmentConfig = {
  directoryPath: string;
};

export const NodeFilesystemEnvironmentName = 'node-filesystem';

/**
 * A Node.js filesystem-based execution environment.
 *
 * This environment uses Node.js fs/promises APIs to provide filesystem operations
 * within a specified directory path. All relative file paths are resolved relative
 * to the configured directoryPath.
 */
export class NodeFilesystemEnvironment extends FilesystemEnvironmentBase<NodeFilesystemEnvironmentConfig> {
  /**
   * Constructs a new NodeFilesystemEnvironment instance.
   *
   * @param config - Environment configuration including the mandatory directoryPath.
   */
  constructor(config: NodeFilesystemEnvironmentConfig) {
    if (!config.directoryPath) {
      throw new Error('The directory path must be provided');
    }

    super(config);
  }

  /**
   * Gets the environment name.
   *
   * @returns The environment name.
   */
  get name(): string {
    return NodeFilesystemEnvironmentName;
  }

  /**
   * Checks whether a file exists at the specified path relative to the project directory.
   *
   * @param relativePath - The path to the file to check, relative to the project directory.
   * @returns True if the file exists, false otherwise.
   */
  protected async fileExists(relativePath: string): Promise<boolean> {
    const absolutePath = path.join(this._envConfig.directoryPath, relativePath);

    try {
      await fs.stat(absolutePath);
      return true;
    } catch {
      return false;
    }
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
    const absolutePath = path.join(this._envConfig.directoryPath, relativePath);
    return fs.readFile(absolutePath, 'utf-8');
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
    const absolutePath = path.join(this._envConfig.directoryPath, relativePath);
    await fs.writeFile(absolutePath, content, 'utf-8');
  }

  /**
   * Deletes a file at the specified path, relative to the project directory.
   *
   * When this method is called, it is guaranteed that the file exists.
   *
   * @param relativePath - The path to the file to delete, relative to the project directory.
   */
  protected async deleteFileContent(relativePath: string): Promise<void> {
    const absolutePath = path.join(this._envConfig.directoryPath, relativePath);
    await fs.rm(absolutePath);
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
    const sourcePath = path.join(
      this._envConfig.directoryPath,
      relativeSourcePath,
    );
    const destinationPath = path.join(
      this._envConfig.directoryPath,
      relativeDestinationPath,
    );
    await fs.rename(sourcePath, destinationPath);
  }
}
