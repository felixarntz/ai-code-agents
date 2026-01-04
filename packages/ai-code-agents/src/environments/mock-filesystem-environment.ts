import path from 'node:path';
import { FilesystemEnvironmentBase } from '@ai-code-agents/environment-utils';

export type MockFilesystemEnvironmentConfig = {
  initialFiles?: Map<string, string>;
  directoryPath?: string;
};

export const MockFilesystemEnvironmentName = 'mock-filesystem';

/**
 * An in-memory execution environment that simulates a filesystem.
 *
 * This environment is useful for testing purposes where you want to control the
 * filesystem state without interacting with the actual disk.
 */
export class MockFilesystemEnvironment extends FilesystemEnvironmentBase<MockFilesystemEnvironmentConfig> {
  protected readonly files: Map<string, string>;
  protected readonly _preparePath: (filePath: string) => string;

  /**
   * Constructs a new environment instance.
   *
   * @param config - Environment configuration.
   */
  constructor(config: MockFilesystemEnvironmentConfig = {}) {
    super(config);

    const { initialFiles, directoryPath } = this._envConfig;
    this.files = initialFiles ?? new Map<string, string>();
    this._preparePath = directoryPath
      ? (filePath: string) => path.join(directoryPath, filePath)
      : (filePath: string) => filePath;
  }

  /**
   * Gets the environment name.
   *
   * @returns The environment name.
   */
  get name(): string {
    return MockFilesystemEnvironmentName;
  }

  /**
   * Checks whether a file exists at the specified path relative to the project directory.
   *
   * @param relativePath - The path to the file to check, relative to the project directory.
   * @returns True if the file exists, false otherwise.
   */
  protected async fileExists(relativePath: string): Promise<boolean> {
    return this.files.has(this._preparePath(relativePath));
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
    return this.files.get(this._preparePath(relativePath)) ?? '';
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
    this.files.set(this._preparePath(relativePath), content);
  }

  /**
   * Deletes a file at the specified path, relative to the project directory.
   *
   * @param relativePath - The path to the file to delete, relative to the project directory.
   */
  protected async deleteFileContent(relativePath: string): Promise<void> {
    this.files.delete(this._preparePath(relativePath));
  }
}
