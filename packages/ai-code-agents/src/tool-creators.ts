import type { Tool } from '@ai-sdk/provider-utils';
import type { Environment, CommandLineEnvironmentInterface } from './types';
import type { EnvironmentToolBase } from './tools/environment-tool-base';
import { ReadFileTool, ReadFileToolName } from './tools/read-file-tool';
import { WriteFileTool, WriteFileToolName } from './tools/write-file-tool';
import { DeleteFileTool, DeleteFileToolName } from './tools/delete-file-tool';
import { EditFileTool, EditFileToolName } from './tools/edit-file-tool';
import { MoveFileTool, MoveFileToolName } from './tools/move-file-tool';
import { CopyFileTool, CopyFileToolName } from './tools/copy-file-tool';
import {
  ReadManyFilesTool,
  ReadManyFilesToolName,
} from './tools/read-many-files-tool';
import { GlobTool, GlobToolName } from './tools/glob-tool';
import {
  ListDirectoryTool,
  ListDirectoryToolName,
} from './tools/list-directory-tool';
import { RunCommandTool, RunCommandToolName } from './tools/run-command-tool';

const availableEnvironmentTools = {
  [ReadFileToolName]: ReadFileTool,
  [WriteFileToolName]: WriteFileTool,
  [DeleteFileToolName]: DeleteFileTool,
  [EditFileToolName]: EditFileTool,
  [MoveFileToolName]: MoveFileTool,
  [CopyFileToolName]: CopyFileTool,
  [ReadManyFilesToolName]: ReadManyFilesTool,
  [GlobToolName]: GlobTool,
  [ListDirectoryToolName]: ListDirectoryTool,
  [RunCommandToolName]: RunCommandTool,
};

type EnvironmentToolClasses = {
  [ReadFileToolName]: ReadFileTool;
  [WriteFileToolName]: WriteFileTool;
  [DeleteFileToolName]: DeleteFileTool;
  [EditFileToolName]: EditFileTool;
  [MoveFileToolName]: MoveFileTool;
  [CopyFileToolName]: CopyFileTool;
  [ReadManyFilesToolName]: ReadManyFilesTool;
  [GlobToolName]: GlobTool;
  [ListDirectoryToolName]: ListDirectoryTool;
  [RunCommandToolName]: RunCommandTool;
};

const cliOnlyTools: EnvironmentToolName[] = [
  GlobToolName,
  ListDirectoryToolName,
  RunCommandToolName,
];

const readonlyTools: EnvironmentToolName[] = [
  ReadFileToolName,
  ReadManyFilesToolName,
  GlobToolName,
  ListDirectoryToolName,
];

const dangerousTools: EnvironmentToolName[] = [
  DeleteFileToolName,
  RunCommandToolName,
];

export type EnvironmentToolSafetyLevel = 'readonly' | 'basic' | 'all';
export const EnvironmentToolSafetyLevels: EnvironmentToolSafetyLevel[] = [
  'readonly',
  'basic',
  'all',
];

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
type EnvironmentToolInputTypeOf<T> =
  EnvironmentToolGenerics<T>['ToolInputType'];
type EnvironmentToolOutputTypeOf<T> =
  EnvironmentToolGenerics<T>['ToolOutputType'];
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

type ToolCreatorConfig = EnvironmentToolName extends infer T
  ? T extends EnvironmentToolName
    ? {
        toolName: T;
        toolConfig?: EnvironmentToolConfigOf<EnvironmentToolClasses[T]>;
      }
    : never
  : never;

export type ToolsDefinition =
  | Array<EnvironmentToolName | ToolCreatorConfig>
  | EnvironmentToolSafetyLevel;

type SanitizedToolsDefinition = ToolCreatorConfig[];

type ToolWithIO = EnvironmentToolName extends infer T
  ? T extends EnvironmentToolName
    ? Tool<
        EnvironmentToolInputTypeOf<EnvironmentToolClasses[T]>,
        EnvironmentToolOutputTypeOf<EnvironmentToolClasses[T]>
      >
    : never
  : never;

/**
 * Creates a map of tools for the given environment.
 *
 * @param environment - The execution environment to create the tools for.
 * @param toolsDefinition - The names of the tools to create, or 'readonly', 'basic', or 'all' as a shortcut for groups of available tools.
 * @returns A record mapping tool names to their corresponding Tool instances.
 */
export function createToolsForEnvironment(
  environment: Environment,
  toolsDefinition: ToolsDefinition = 'all',
): Record<string, ToolWithIO> {
  const sanitizedToolsDefinition = sanitizeToolsDefinition(toolsDefinition);

  const isCliEnvironment = 'runCommand' in environment;

  const tools: Record<string, ToolWithIO> = {};
  for (const toolDefinition of sanitizedToolsDefinition) {
    const actualToolName = toolDefinition.toolName;

    // Manual check for CLI-only tools.
    if (!isCliEnvironment && cliOnlyTools.includes(actualToolName)) {
      throw new Error(
        `The "${actualToolName}" tool can only be used with command-line environments.`,
      );
    }

    const toolNameToUse =
      toolDefinition.toolConfig?.name || toolDefinition.toolName;
    let toolConfig: ToolCreatorConfig['toolConfig'];
    if (toolDefinition.toolConfig) {
      toolConfig = toolDefinition.toolConfig;
    }

    if (toolNameToUse in tools) {
      throw new Error(
        `Multiple tools named "${toolNameToUse}" are provided - make sure tool names are unique.`,
      );
    }

    tools[toolNameToUse] = createEnvironmentTool(
      actualToolName,
      isCliEnvironment
        ? (environment as CommandLineEnvironmentInterface)
        : environment,
      toolConfig,
    );
  }

  return tools;
}

/**
 * Creates a map of tools for the given environment, modifying tool names with the environment name to avoid conflicts.
 *
 * For example, if the environment name is "env1" and the tool is "read_file", the modified tool name will be "read_file_in_env1".
 *
 * @param environmentName - The name of the environment. Will be used in tool names to avoid conflicts.
 * @param environment - The execution environment to create the tools for.
 * @param toolsDefinition - The names of the tools to create, or 'readonly', 'basic', or 'all' as a shortcut for groups of available tools.
 * @returns A record mapping tool names to their corresponding Tool instances.
 */
export function createToolsForNamedEnvironment(
  environmentName: string,
  environment: Environment,
  toolsDefinition: ToolsDefinition = 'all',
): Record<string, ToolWithIO> {
  const sanitizedToolsDefinition = sanitizeToolsDefinition(toolsDefinition);

  const toolsDefinitionWithEnvironmentName = sanitizedToolsDefinition.map(
    (toolDefinition): ToolCreatorConfig => {
      if (toolDefinition.toolConfig) {
        const toolNameToUse =
          toolDefinition.toolConfig.name || toolDefinition.toolName;
        return {
          toolName: toolDefinition.toolName,
          toolConfig: {
            ...toolDefinition.toolConfig,
            name: `${toolNameToUse}_in_${environmentName}`,
          },
        };
      }
      return {
        toolName: toolDefinition.toolName,
        toolConfig: {
          name: `${toolDefinition.toolName}_in_${environmentName}`,
        },
      };
    },
  );

  return createToolsForEnvironment(
    environment,
    toolsDefinitionWithEnvironmentName,
  );
}

/**
 * Sanitizes a tools definition into a consistent format.
 *
 * @param toolsDefinition - The tools definition to sanitize.
 * @returns A sanitized array of tool definitions.
 */
function sanitizeToolsDefinition(
  toolsDefinition: ToolsDefinition,
): SanitizedToolsDefinition {
  if (typeof toolsDefinition === 'string') {
    switch (toolsDefinition) {
      case 'readonly':
        toolsDefinition = readonlyTools;
        break;
      case 'basic':
        toolsDefinition = EnvironmentToolNames.filter(
          (toolName) => !dangerousTools.includes(toolName),
        );
        break;
      default:
        toolsDefinition = [...EnvironmentToolNames];
    }
  }

  return toolsDefinition.map((tool) => {
    if (typeof tool === 'string') {
      return { toolName: tool };
    }
    return tool;
  });
}
