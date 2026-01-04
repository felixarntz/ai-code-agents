import { z } from 'zod';
import {
  EnvironmentToolBase,
  type EnvironmentToolMetadata,
  ReadFileResult,
  type FilesystemEnvironmentInterface,
  type ToolConfig,
  type ToolExample,
  type ModelToolResultToFormat,
  type ModelFormattedToolResult,
} from '@ai-code-agents/environment-utils';
import { getLanguageIdentifierFromFilePath } from '../util/get-language-identifier-from-file-path';

export const ReadFileToolName = 'read_file';

export type ReadFileToolConfig = ToolConfig;

export const ReadFileToolInput = z.object({
  path: z.string().meta({
    description:
      'The path to the file to read, relative to the project directory.',
  }),
});

export type ReadFileToolInput = z.infer<typeof ReadFileToolInput>;

export const ReadFileToolOutput = ReadFileResult;

export type ReadFileToolOutput = z.infer<typeof ReadFileToolOutput>;

const formatModelResponse = (output: ReadFileToolOutput) => {
  const language = getLanguageIdentifierFromFilePath(output.path);
  return `File: \`${output.path}\`
Content:
\`\`\`${language}
${output.content}
\`\`\`
`;
};

/**
 * Class for the ReadFile tool.
 */
export class ReadFileTool extends EnvironmentToolBase<
  ReadFileToolConfig,
  ReadFileToolInput,
  ReadFileToolOutput,
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
    ReadFileToolInput,
    ReadFileToolOutput
  > {
    return {
      name: ReadFileToolName,
      description: 'Reads the content of a file at the specified path.',
      inputSchema: ReadFileToolInput,
      outputSchema: ReadFileToolOutput,
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
    input: ReadFileToolInput,
  ): Promise<ReadFileToolOutput> {
    return env.readFile(input.path);
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param options - The tool result, including the output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(
    options: ModelToolResultToFormat<ReadFileToolInput, ReadFileToolOutput>,
  ): ModelFormattedToolResult {
    const { output } = options;
    return {
      type: 'text',
      value: formatModelResponse(output),
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<ToolExample<ReadFileToolInput, ReadFileToolOutput>> {
    const exampleContent = `import clsx from 'clsx';

type LoaderProps = {
  className?: string;
};

export function Loader(props: LoaderProps) {
  const { className } = props;

  return (
    <div className={clsx('loader', className)}>
      Loading…
    </div>
  );
}
`;

    return [
      {
        input: {
          path: 'src/components/Loader.tsx',
        },
        output: formatModelResponse({
          path: 'src/components/Loader.tsx',
          content: exampleContent,
        }),
      },
    ];
  }
}
