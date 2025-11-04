import { z } from 'zod';
import {
  MoveFileResult,
  type FilesystemEnvironmentInterface,
  type ToolConfig,
  type ToolExample,
  type ModelFormattedToolResult,
} from '../types';
import {
  EnvironmentToolBase,
  type EnvironmentToolMetadata,
} from './environment-tool-base';

export const MoveFileToolName = 'move_file';

export type MoveFileToolConfig = ToolConfig;

export const MoveFileToolInput = z.object({
  sourcePath: z.string().meta({
    description:
      'The path to the file to move, relative to the project directory.',
  }),
  destinationPath: z.string().meta({
    description:
      'The path to the destination where the file should be moved, relative to the project directory. If the file already exists, it will be overwritten.',
  }),
});

export type MoveFileToolInput = z.infer<typeof MoveFileToolInput>;

export const MoveFileToolOutput = MoveFileResult;

export type MoveFileToolOutput = z.infer<typeof MoveFileToolOutput>;

/**
 * Class for the MoveFile tool.
 */
export class MoveFileTool extends EnvironmentToolBase<
  MoveFileToolConfig,
  MoveFileToolInput,
  MoveFileToolOutput,
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
    MoveFileToolInput,
    MoveFileToolOutput
  > {
    return {
      name: MoveFileToolName,
      description: 'Moves a file from a source path to a destination path.',
      inputSchema: MoveFileToolInput,
      outputSchema: MoveFileToolOutput,
      needsApproval: false,
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
    input: MoveFileToolInput,
  ): Promise<MoveFileToolOutput> {
    return env.moveFile(input.sourcePath, input.destinationPath);
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param output - The output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(output: MoveFileToolOutput): ModelFormattedToolResult {
    return {
      type: 'text',
      value: `File \`${output.sourcePath}\` moved successfully to \`${output.destinationPath}\`.`,
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<ToolExample<MoveFileToolInput, MoveFileToolOutput>> {
    return [
      {
        input: {
          sourcePath: 'src/lib/types.ts',
          destinationPath: 'lib/index.ts',
        },
        output: 'File `src/lib/types.ts` moved successfully to `lib/index.ts`.',
      },
    ];
  }
}
