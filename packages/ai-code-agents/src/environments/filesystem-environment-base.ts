import { validateRelativePath } from '../util/validate-relative-path';
import type {
  FilesystemEnvironmentInterface,
  ReadFileResult,
  WriteFileResult,
  DeleteFileResult,
  MoveFileResult,
  CopyFileResult,
} from '../types';

/**
 * Base class for a filesystem-based execution environment.
 */
export abstract class FilesystemEnvironmentBase<
  EnvironmentConfig,
> implements FilesystemEnvironmentInterface {
  protected _envConfig: EnvironmentConfig;

  /**
   * Constructs a new environment instance.
   *
   * @param config - Environment configuration.
   */
  constructor(config: EnvironmentConfig) {
    this._envConfig = config;
  }

  /**
   * Gets the environment name.
   *
   * @returns The environment name.
   */
  abstract get name(): string;

  /**
   * Reads the content of a file at the specified path.
   *
   * @param path - The path to the file to read, relative to the project directory.
   * @returns A promise that resolves to a ReadFileResult.
   */
  async readFile(path: string): Promise<ReadFileResult> {
    validateRelativePath(path);

    if (!(await this.fileExists(path))) {
      throw new Error(`File not found: ${path}`);
    }

    const content = await this.readFileContent(path);

    return {
      path,
      content,
    };
  }

  /**
   * Writes content to a file at the specified path.
   *
   * If a file is already present at the path, it will be overwritten.
   *
   * @param path - The path to the file to write, relative to the project directory.
   * @param content - The content to write to the file.
   * @returns A promise that resolves to a WriteFileResult.
   */
  async writeFile(path: string, content: string): Promise<WriteFileResult> {
    validateRelativePath(path);

    await this.writeFileContent(path, content);

    return {
      path,
      message: 'File written successfully.',
    };
  }

  /**
   * Deletes a file at the specified path.
   *
   * @param path - The path to the file to delete, relative to the project directory.
   * @returns A promise that resolves to a DeleteFileResult.
   */
  async deleteFile(path: string): Promise<DeleteFileResult> {
    validateRelativePath(path);

    if (!(await this.fileExists(path))) {
      return {
        path,
        message: 'File was already deleted.',
      };
    }

    await this.deleteFileContent(path);

    return {
      path,
      message: 'File deleted successfully.',
    };
  }

  /**
   * Moves a file from a source path to a destination path.
   *
   * If a file is already present at the destination path, it will be overwritten.
   *
   * @param sourcePath - The path to the file to move.
   * @param destinationPath - The path to move the file to.
   * @returns A promise that resolves to a MoveFileResult.
   */
  async moveFile(
    sourcePath: string,
    destinationPath: string,
  ): Promise<MoveFileResult> {
    validateRelativePath(sourcePath);
    validateRelativePath(destinationPath);

    if (!(await this.fileExists(sourcePath))) {
      throw new Error(`File not found: ${sourcePath}`);
    }

    await this.moveFileContent(sourcePath, destinationPath);

    return {
      sourcePath,
      destinationPath,
      message: 'File moved successfully.',
    };
  }

  /**
   * Copies a file from a source path to a destination path.
   *
   * If a file is already present at the destination path, it will be overwritten.
   *
   * @param sourcePath - The path to the file to copy.
   * @param destinationPath - The path to copy the file to.
   * @returns A promise that resolves to a CopyFileResult.
   */
  async copyFile(
    sourcePath: string,
    destinationPath: string,
  ): Promise<CopyFileResult> {
    validateRelativePath(sourcePath);
    validateRelativePath(destinationPath);

    if (!(await this.fileExists(sourcePath))) {
      throw new Error(`File not found: ${sourcePath}`);
    }

    await this.copyFileContent(sourcePath, destinationPath);

    return {
      sourcePath,
      destinationPath,
      message: 'File copied successfully.',
    };
  }

  /**
   * Checks whether a file exists at the specified path relative to the project directory.
   *
   * @param relativePath - The path to the file to check, relative to the project directory.
   * @returns True if the file exists, false otherwise.
   */
  protected abstract fileExists(relativePath: string): Promise<boolean>;

  /**
   * Gets the content of a file at the specified path, relative to the project directory.
   *
   * When this method is called, it is guaranteed that the file exists.
   *
   * @param relativePath - The path to the file to read, relative to the project directory.
   * @returns The content of the file.
   */
  protected abstract readFileContent(relativePath: string): Promise<string>;

  /**
   * Writes content to a file at the specified path, relative to the project directory.
   *
   * This method unconditionally writes the content, even if a file already exists at the path, or if the file is new.
   *
   * @param relativePath - The path to the file to write, relative to the project directory.
   * @param content - The content to write to the file.
   */
  protected abstract writeFileContent(
    relativePath: string,
    content: string,
  ): Promise<void>;

  /**
   * Deletes a file at the specified path, relative to the project directory.
   *
   * When this method is called, it is guaranteed that the file exists.
   *
   * @param relativePath - The path to the file to delete, relative to the project directory.
   */
  protected abstract deleteFileContent(relativePath: string): Promise<void>;

  /**
   * Moves the content of a file from a source path to a destination path, relative to the project directory.
   *
   * When this method is called, it is guaranteed that the source file exists.
   * This method unconditionally moves the content, even if a file already exists at the destination path.
   *
   * @param relativeSourcePath - The path to the file to move, relative to the project directory.
   * @param relativeDestinationPath - The path to move the file to, relative to the project directory.
   */
  protected async moveFileContent(
    relativeSourcePath: string,
    relativeDestinationPath: string,
  ): Promise<void> {
    const content = await this.readFileContent(relativeSourcePath);
    this.writeFileContent(relativeDestinationPath, content);
    this.deleteFileContent(relativeSourcePath);
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
  protected async copyFileContent(
    relativeSourcePath: string,
    relativeDestinationPath: string,
  ): Promise<void> {
    const content = await this.readFileContent(relativeSourcePath);
    this.writeFileContent(relativeDestinationPath, content);
  }
}
