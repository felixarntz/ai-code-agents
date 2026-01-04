import { z } from 'zod';
import {
  EnvironmentToolBase,
  type EnvironmentToolMetadata,
  WriteFileResult,
  type FilesystemEnvironmentInterface,
  type ToolConfig,
  type ToolExample,
  type ModelToolResultToFormat,
  type ModelFormattedToolResult,
} from '@ai-code-agents/environment-utils';

export const WriteFileToolName = 'write_file';

export type WriteFileToolConfig = ToolConfig;

export const WriteFileToolInput = z.object({
  path: z.string().meta({
    description:
      'The path to the file to write, relative to the project directory.',
  }),
  content: z.string().meta({
    description:
      'The content to write to the file. If the file already exists, the content will replace existing content.',
  }),
});

export type WriteFileToolInput = z.infer<typeof WriteFileToolInput>;

export const WriteFileToolOutput = WriteFileResult;

export type WriteFileToolOutput = z.infer<typeof WriteFileToolOutput>;

/**
 * Class for the WriteFile tool.
 */
export class WriteFileTool extends EnvironmentToolBase<
  WriteFileToolConfig,
  WriteFileToolInput,
  WriteFileToolOutput,
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
    WriteFileToolInput,
    WriteFileToolOutput
  > {
    return {
      name: WriteFileToolName,
      description: 'Writes content to a file at the specified path.',
      inputSchema: WriteFileToolInput,
      outputSchema: WriteFileToolOutput,
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
    input: WriteFileToolInput,
  ): Promise<WriteFileToolOutput> {
    return env.writeFile(input.path, input.content);
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param options - The tool result, including the output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(
    options: ModelToolResultToFormat<WriteFileToolInput, WriteFileToolOutput>,
  ): ModelFormattedToolResult {
    const { output } = options;
    return {
      type: 'text',
      value: `File \`${output.path}\` written successfully.`,
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<ToolExample<WriteFileToolInput, WriteFileToolOutput>> {
    const exampleContent = `export function snakeCaseToCamelCase(snakeCase: string): string {
  return snakeCase.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
`;

    return [
      {
        input: {
          path: 'src/util/snake-case-to-camel-case.ts',
          content: exampleContent,
        },
        output:
          'File `src/util/snake-case-to-camel-case.ts` written successfully.',
      },
    ];
  }
}
