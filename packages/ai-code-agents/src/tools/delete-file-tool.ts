import { z } from 'zod';
import {
  DeleteFileResult,
  type FilesystemEnvironmentInterface,
  type ToolConfig,
  type ToolExample,
  type ModelToolResultToFormat,
  type ModelFormattedToolResult,
} from '../types';
import {
  EnvironmentToolBase,
  type EnvironmentToolMetadata,
} from './environment-tool-base';

export const DeleteFileToolName = 'delete_file';

export type DeleteFileToolConfig = ToolConfig;

export const DeleteFileToolInput = z.object({
  path: z.string().meta({
    description:
      'The path to the file to delete, relative to the project directory.',
  }),
});

export type DeleteFileToolInput = z.infer<typeof DeleteFileToolInput>;

export const DeleteFileToolOutput = DeleteFileResult;

export type DeleteFileToolOutput = z.infer<typeof DeleteFileToolOutput>;

/**
 * Class for the DeleteFile tool.
 */
export class DeleteFileTool extends EnvironmentToolBase<
  DeleteFileToolConfig,
  DeleteFileToolInput,
  DeleteFileToolOutput,
  FilesystemEnvironmentInterface
> {
  /**
   * Returns the metadata for the tool.
   *
   * The name, description, and needsApproval properties are defaults which can be overridden in the constructor.
   *
   * @returns The tool metadata.
   */
  protected getMetadata(): EnvironmentToolMetadata<
    DeleteFileToolInput,
    DeleteFileToolOutput
  > {
    return {
      name: DeleteFileToolName,
      description: 'Deletes the file at the specified path.',
      inputSchema: DeleteFileToolInput,
      outputSchema: DeleteFileToolOutput,
      needsApproval: true,
    };
  }

  /**
   * Executes the tool in the given execution environment with the given input.
   *
   * @param env - The execution environment to use.
   * @param input - The input for the tool.
   * @returns A promise that resolves to the tool execution result.
   */
  protected executeForEnvironment(
    env: FilesystemEnvironmentInterface,
    input: DeleteFileToolInput,
  ): Promise<DeleteFileToolOutput> {
    return env.deleteFile(input.path);
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param options - The tool result, including the output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(
    options: ModelToolResultToFormat<DeleteFileToolInput, DeleteFileToolOutput>,
  ): ModelFormattedToolResult {
    const { output } = options;
    return {
      type: 'text',
      value: `File \`${output.path}\` deleted successfully.`,
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<
    ToolExample<DeleteFileToolInput, DeleteFileToolOutput>
  > {
    return [
      {
        input: {
          path: 'src/components/Chart.tsx',
        },
        output: 'File `src/components/Chart.tsx` deleted successfully.',
      },
    ];
  }
}
