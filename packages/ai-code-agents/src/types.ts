import type { FlexibleSchema } from '@ai-sdk/provider-utils';
import type { ToolCallOptions } from 'ai';
import * as z from 'zod';

export const ReadFileResult = z.object({
  path: z.string().meta({
    description: 'The path to the file that was read.',
  }),
  content: z.string().meta({
    description: 'The content of the file that was read.',
  }),
});

export type ReadFileResult = z.infer<typeof ReadFileResult>;

export const WriteFileResult = z.object({
  path: z.string().meta({
    description: 'The path to the file that was written.',
  }),
  message: z.string().meta({
    description: 'A message indicating the result of the write operation.',
  }),
});

export type WriteFileResult = z.infer<typeof WriteFileResult>;

export const DeleteFileResult = z.object({
  path: z.string().meta({
    description: 'The path to the file that was deleted.',
  }),
  message: z.string().meta({
    description: 'A message indicating the result of the delete operation.',
  }),
});

export type DeleteFileResult = z.infer<typeof DeleteFileResult>;

export const MoveFileResult = z.object({
  sourcePath: z.string().meta({
    description: 'The original path of the file that was moved.',
  }),
  destinationPath: z.string().meta({
    description: 'The new path of the file that was moved to.',
  }),
  message: z.string().meta({
    description: 'A message indicating the result of the move operation.',
  }),
});

export type MoveFileResult = z.infer<typeof MoveFileResult>;

export const CopyFileResult = z.object({
  sourcePath: z.string().meta({
    description: 'The original path of the file that was copied.',
  }),
  destinationPath: z.string().meta({
    description: 'The new path of the file that was copied to.',
  }),
  message: z.string().meta({
    description: 'A message indicating the result of the copy operation.',
  }),
});

export type CopyFileResult = z.infer<typeof CopyFileResult>;

export const RunCommandResult = z.object({
  command: z.string().meta({
    description: 'The command that was executed.',
  }),
  exitCode: z.number().meta({
    description: 'The exit code of the command.',
  }),
  stdout: z.string().meta({
    description: 'The standard output of the command.',
  }),
  stderr: z.string().meta({
    description: 'The standard error output of the command.',
  }),
});

export type RunCommandResult = z.infer<typeof RunCommandResult>;

export interface FilesystemEnvironmentInterface {
  get name(): string;
  readFile(path: string): Promise<ReadFileResult>;
  writeFile(path: string, content: string): Promise<WriteFileResult>;
  deleteFile(path: string): Promise<DeleteFileResult>;
  moveFile(
    sourcePath: string,
    destinationPath: string,
  ): Promise<MoveFileResult>;
  copyFile(
    sourcePath: string,
    destinationPath: string,
  ): Promise<CopyFileResult>;
}

export interface CommandLineEnvironmentInterface
  extends FilesystemEnvironmentInterface {
  runCommand(command: string): Promise<RunCommandResult>;
}

export type Environment =
  | FilesystemEnvironmentInterface
  | CommandLineEnvironmentInterface;

// These types must be compatible with or subtypes of the LanguageModelV3ToolResultOutput type from '@ai-sdk/provider'.
type ModelTextResult = { type: 'text'; value: string };
type ModelTextPart = { type: 'text'; text: string };
type ModelMediaPart = { type: 'media'; data: string; mediaType: string };
export type ModelFormattedToolResult =
  | ModelTextResult
  | {
      type: 'content';
      value: Array<ModelTextPart | ModelMediaPart>;
    };

export type ToolExample<ToolInputType, ToolOutputType> = {
  input: ToolInputType;
  output: ToolOutputType | string;
};

// This interface must be compatible with the Tool interface from 'ai'.
export interface ToolInterface<ToolInputType, ToolOutputType> {
  get name(): string;
  get description(): string;
  get inputSchema(): FlexibleSchema<ToolInputType>;
  get outputSchema(): FlexibleSchema<ToolOutputType>;
  execute(
    input: ToolInputType,
    options: ToolCallOptions,
  ): Promise<ToolOutputType>;
  toModelOutput(output: ToolOutputType): ModelFormattedToolResult;
  get examples(): Array<ToolExample<ToolInputType, ToolOutputType>>;
  get needsApproval(): boolean;
}

export interface EnvironmentToolInterface<
  ToolInputType,
  ToolOutputType,
  EnvironmentType,
> extends ToolInterface<ToolInputType, ToolOutputType> {
  get environment(): EnvironmentType;
}

// Optional constructor parameter for tools.
export type ToolConfig = {
  name?: string;
  description?: string;
  needsApproval?: boolean;
};
