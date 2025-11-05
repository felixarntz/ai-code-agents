import type { EnvironmentToolBase } from './tools/environment-tool-base';
import { ReadFileTool, ReadFileToolName } from './tools/read-file-tool';
import { WriteFileTool, WriteFileToolName } from './tools/write-file-tool';
import { DeleteFileTool, DeleteFileToolName } from './tools/delete-file-tool';
import { MoveFileTool, MoveFileToolName } from './tools/move-file-tool';
import { CopyFileTool, CopyFileToolName } from './tools/copy-file-tool';
import {
  ListDirectoryTool,
  ListDirectoryToolName,
} from './tools/list-directory-tool';
import { RunCommandTool, RunCommandToolName } from './tools/run-command-tool';

const availableEnvironmentTools = {
  [ReadFileToolName]: ReadFileTool,
  [WriteFileToolName]: WriteFileTool,
  [DeleteFileToolName]: DeleteFileTool,
  [MoveFileToolName]: MoveFileTool,
  [CopyFileToolName]: CopyFileTool,
  [ListDirectoryToolName]: ListDirectoryTool,
  [RunCommandToolName]: RunCommandTool,
};

type EnvironmentToolClasses = {
  [ReadFileToolName]: ReadFileTool;
  [WriteFileToolName]: WriteFileTool;
  [DeleteFileToolName]: DeleteFileTool;
  [MoveFileToolName]: MoveFileTool;
  [CopyFileToolName]: CopyFileTool;
  [ListDirectoryToolName]: ListDirectoryTool;
  [RunCommandToolName]: RunCommandTool;
};

type EnvironmentToolGenerics<T> =
  T extends EnvironmentToolBase<
    infer ToolConfig,
    infer ToolInput,
    infer ToolOutput,
    infer ToolEnvironment
  >
    ? {
        ToolConfigType: ToolConfig;
        ToolInputType: ToolInput;
        ToolOutputType: ToolOutput;
        ToolEnvironmentType: ToolEnvironment;
      }
    : never;

/*
 * This workaround using a property is required because, when using generics with a base constraint,
 * TypeScript will always resolve the generic to the base constraint when trying to infer types later on.
 * By introducing a dummy property that uses the generic, TypeScript can correctly infer the actual types.
 */
type EnvironmentToolConfigOf<T> = T extends { _toolConfig: infer C }
  ? C
  : never;
type EnvironmentToolEnvironmentTypeOf<T> =
  EnvironmentToolGenerics<T>['ToolEnvironmentType'];

export type EnvironmentToolName = keyof typeof availableEnvironmentTools;
export const EnvironmentToolNames = Object.keys(
  availableEnvironmentTools,
) as EnvironmentToolName[];

/**
 * Creates an environment tool instance based on the provided name, execution environment, and configuration.
 *
 * @param toolName - The name identifying the type of environment tool to create.
 * @param environment - The execution environment to create the tool for.
 * @param config - The configuration object for the environment tool.
 * @returns An instance of the specified environment tool.
 */
export function createEnvironmentTool<T extends EnvironmentToolName>(
  toolName: T,
  environment: EnvironmentToolEnvironmentTypeOf<EnvironmentToolClasses[T]>,
  config?: EnvironmentToolConfigOf<EnvironmentToolClasses[T]>,
): EnvironmentToolClasses[T] {
  // Extra safe-guard - should not be needed.
  if (!(toolName in availableEnvironmentTools)) {
    throw new Error(`Unsupported environment: ${toolName}`);
  }

  const EnvironmentToolClass = availableEnvironmentTools[toolName as T];

  return new EnvironmentToolClass(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    environment as any,
    config,
  ) as EnvironmentToolClasses[T];
}
