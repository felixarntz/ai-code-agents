import { z } from 'zod';
import {
  EnvironmentToolBase,
  type EnvironmentToolMetadata,
  CopyFileResult,
  type FilesystemEnvironmentInterface,
  type ToolConfig,
  type ToolExample,
  type ModelToolResultToFormat,
  type ModelFormattedToolResult,
} from '@ai-code-agents/environment-utils';

export const CopyFileToolName = 'copy_file';

export type CopyFileToolConfig = ToolConfig;

export const CopyFileToolInput = z.object({
  sourcePath: z.string().meta({
    description:
      'The path to the file to copy, relative to the project directory.',
  }),
  destinationPath: z.string().meta({
    description:
      'The path to the destination where the file should be copied, relative to the project directory. If the file already exists, it will be overwritten.',
  }),
});

export type CopyFileToolInput = z.infer<typeof CopyFileToolInput>;

export const CopyFileToolOutput = CopyFileResult;

export type CopyFileToolOutput = z.infer<typeof CopyFileToolOutput>;

/**
 * Class for the CopyFile tool.
 */
export class CopyFileTool extends EnvironmentToolBase<
  CopyFileToolConfig,
  CopyFileToolInput,
  CopyFileToolOutput,
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
    CopyFileToolInput,
    CopyFileToolOutput
  > {
    return {
      name: CopyFileToolName,
      description: 'Copies a file from a source path to a destination path.',
      inputSchema: CopyFileToolInput,
      outputSchema: CopyFileToolOutput,
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
    input: CopyFileToolInput,
  ): Promise<CopyFileToolOutput> {
    return env.copyFile(input.sourcePath, input.destinationPath);
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param options - The tool result, including the output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(
    options: ModelToolResultToFormat<CopyFileToolInput, CopyFileToolOutput>,
  ): ModelFormattedToolResult {
    const { output } = options;
    return {
      type: 'text',
      value: `File \`${output.sourcePath}\` copied successfully to \`${output.destinationPath}\`.`,
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<ToolExample<CopyFileToolInput, CopyFileToolOutput>> {
    return [
      {
        input: {
          sourcePath: 'src/index.ts',
          destinationPath: 'index.ts',
        },
        output: 'File `src/index.ts` copied successfully to `index.ts`.',
      },
    ];
  }
}
