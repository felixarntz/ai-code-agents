/* Note: This file exists purely to ensure compatibility with the AI SDK tool shape. None of these functions should be globally exported. */

import type { Tool } from '@ai-sdk/provider-utils';
import { createEnvironmentTool } from './tool-creators';
import type {
  FilesystemEnvironmentInterface,
  CommandLineEnvironmentInterface,
} from './types';
import {
  ReadFileToolName,
  type ReadFileToolConfig,
  type ReadFileToolInput,
  type ReadFileToolOutput,
} from './tools/read-file-tool';
import {
  WriteFileToolName,
  type WriteFileToolConfig,
  type WriteFileToolInput,
  type WriteFileToolOutput,
} from './tools/write-file-tool';
import {
  DeleteFileToolName,
  type DeleteFileToolConfig,
  type DeleteFileToolInput,
  type DeleteFileToolOutput,
} from './tools/delete-file-tool';
import {
  EditFileToolName,
  type EditFileToolConfig,
  type EditFileToolInput,
  type EditFileToolOutput,
} from './tools/edit-file-tool';
import {
  MoveFileToolName,
  type MoveFileToolConfig,
  type MoveFileToolInput,
  type MoveFileToolOutput,
} from './tools/move-file-tool';
import {
  CopyFileToolName,
  type CopyFileToolConfig,
  type CopyFileToolInput,
  type CopyFileToolOutput,
} from './tools/copy-file-tool';
import {
  ReadManyFilesToolName,
  type ReadManyFilesToolConfig,
  type ReadManyFilesToolInput,
  type ReadManyFilesToolOutput,
} from './tools/read-many-files-tool';
import {
  GetProjectFileStructureToolName,
  type GetProjectFileStructureToolConfig,
  type GetProjectFileStructureToolInput,
  type GetProjectFileStructureToolOutput,
} from './tools/get-project-file-structure-tool';
import {
  GlobToolName,
  type GlobToolConfig,
  type GlobToolInput,
  type GlobToolOutput,
} from './tools/glob-tool';
import {
  GrepToolName,
  type GrepToolConfig,
  type GrepToolInput,
  type GrepToolOutput,
} from './tools/grep-tool';
import {
  ListDirectoryToolName,
  type ListDirectoryToolConfig,
  type ListDirectoryToolInput,
  type ListDirectoryToolOutput,
} from './tools/list-directory-tool';
import {
  RunCommandToolName,
  type RunCommandToolConfig,
  type RunCommandToolInput,
  type RunCommandToolOutput,
} from './tools/run-command-tool';

// Non-environment tool, handled separately.
import {
  SubmitTool,
  type SubmitToolConfig,
  type SubmitToolInput,
  type SubmitToolOutput,
} from './tools/submit-tool';

/**
 * Creates a ReadFileTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for reading files.
 */
export function createReadFileTool(
  environment: FilesystemEnvironmentInterface,
  config?: ReadFileToolConfig,
): Tool<ReadFileToolInput, ReadFileToolOutput> {
  return createEnvironmentTool(ReadFileToolName, environment, config);
}

/**
 * Creates a WriteFileTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for writing files.
 */
export function createWriteFileTool(
  environment: FilesystemEnvironmentInterface,
  config?: WriteFileToolConfig,
): Tool<WriteFileToolInput, WriteFileToolOutput> {
  return createEnvironmentTool(WriteFileToolName, environment, config);
}

/**
 * Creates a DeleteFileTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for deleting files.
 */
export function createDeleteFileTool(
  environment: FilesystemEnvironmentInterface,
  config?: DeleteFileToolConfig,
): Tool<DeleteFileToolInput, DeleteFileToolOutput> {
  return createEnvironmentTool(DeleteFileToolName, environment, config);
}

/**
 * Creates a EditFileTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for editing files.
 */
export function createEditFileTool(
  environment: FilesystemEnvironmentInterface,
  config?: EditFileToolConfig,
): Tool<EditFileToolInput, EditFileToolOutput> {
  return createEnvironmentTool(EditFileToolName, environment, config);
}

/**
 * Creates a MoveFileTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for moving files.
 */
export function createMoveFileTool(
  environment: FilesystemEnvironmentInterface,
  config?: MoveFileToolConfig,
): Tool<MoveFileToolInput, MoveFileToolOutput> {
  return createEnvironmentTool(MoveFileToolName, environment, config);
}

/**
 * Creates a CopyFileTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for copying files.
 */
export function createCopyFileTool(
  environment: FilesystemEnvironmentInterface,
  config?: CopyFileToolConfig,
): Tool<CopyFileToolInput, CopyFileToolOutput> {
  return createEnvironmentTool(CopyFileToolName, environment, config);
}

/**
 * Creates a ReadManyFilesTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for reading many files.
 */
export function createReadManyFilesTool(
  environment: FilesystemEnvironmentInterface,
  config?: ReadManyFilesToolConfig,
): Tool<ReadManyFilesToolInput, ReadManyFilesToolOutput> {
  return createEnvironmentTool(ReadManyFilesToolName, environment, config);
}

/**
 * Creates a GetProjectFileStructureTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for getting project file structure.
 */
export function createGetProjectFileStructureTool(
  environment: CommandLineEnvironmentInterface,
  config?: GetProjectFileStructureToolConfig,
): Tool<GetProjectFileStructureToolInput, GetProjectFileStructureToolOutput> {
  return createEnvironmentTool(
    GetProjectFileStructureToolName,
    environment,
    config,
  );
}

/**
 * Creates a GlobTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for globbing files.
 */
export function createGlobTool(
  environment: CommandLineEnvironmentInterface,
  config?: GlobToolConfig,
): Tool<GlobToolInput, GlobToolOutput> {
  return createEnvironmentTool(GlobToolName, environment, config);
}

/**
 * Creates a GrepTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for searching files with grep.
 */
export function createGrepTool(
  environment: CommandLineEnvironmentInterface,
  config?: GrepToolConfig,
): Tool<GrepToolInput, GrepToolOutput> {
  return createEnvironmentTool(GrepToolName, environment, config);
}

/**
 * Creates a ListDirectoryTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for listing directory contents.
 */
export function createListDirectoryTool(
  environment: CommandLineEnvironmentInterface,
  config?: ListDirectoryToolConfig,
): Tool<ListDirectoryToolInput, ListDirectoryToolOutput> {
  return createEnvironmentTool(ListDirectoryToolName, environment, config);
}

/**
 * Creates a RunCommandTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param environment - The environment to create the tool for.
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for running command line commands.
 */
export function createRunCommandTool(
  environment: CommandLineEnvironmentInterface,
  config?: RunCommandToolConfig,
): Tool<RunCommandToolInput, RunCommandToolOutput> {
  return createEnvironmentTool(RunCommandToolName, environment, config);
}

/**
 * Creates a SubmitTool instance wrapped as a Tool compatible with the AI SDK.
 *
 * @param config - Optional configuration for the tool.
 * @returns A Tool instance for submitting data.
 */
export function createSubmitTool(
  config?: SubmitToolConfig,
): Tool<SubmitToolInput, SubmitToolOutput> {
  return new SubmitTool(config);
}
