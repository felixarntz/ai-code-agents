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

export const ReadManyFilesToolName = 'read_many_files';

export type ReadManyFilesToolConfig = ToolConfig;

export const ReadManyFilesToolInput = z.object({
  paths: z.array(z.string()).meta({
    description:
      'The paths to the files to read, relative to the project directory.',
  }),
});

export type ReadManyFilesToolInput = z.infer<typeof ReadManyFilesToolInput>;

export const ReadManyFilesToolOutput = z.record(z.string(), ReadFileResult);

export type ReadManyFilesToolOutput = z.infer<typeof ReadManyFilesToolOutput>;

const formatModelResponse = (output: ReadManyFilesToolOutput[string]) => {
  const language = getLanguageIdentifierFromFilePath(output.path);
  return `File: \`${output.path}\`
Content:
\`\`\`${language}
${output.content}
\`\`\`
`;
};

/**
 * Class for the ReadManyFiles tool.
 */
export class ReadManyFilesTool extends EnvironmentToolBase<
  ReadManyFilesToolConfig,
  ReadManyFilesToolInput,
  ReadManyFilesToolOutput,
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
    ReadManyFilesToolInput,
    ReadManyFilesToolOutput
  > {
    return {
      name: ReadManyFilesToolName,
      description: 'Reads the contents of the files at the specified paths.',
      inputSchema: ReadManyFilesToolInput,
      outputSchema: ReadManyFilesToolOutput,
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
  protected async executeForEnvironment(
    env: FilesystemEnvironmentInterface,
    input: ReadManyFilesToolInput,
  ): Promise<ReadManyFilesToolOutput> {
    const results: ReadFileResult[] = await Promise.all(
      input.paths.map((path) => env.readFile(path)),
    );

    return results.reduce((acc, result) => {
      acc[result.path] = result;
      return acc;
    }, {} as ReadManyFilesToolOutput);
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param options - The tool result, including the output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(
    options: ModelToolResultToFormat<
      ReadManyFilesToolInput,
      ReadManyFilesToolOutput
    >,
  ): ModelFormattedToolResult {
    const { output } = options;

    const fileContentResponses = Object.values(output).map((fileResult) =>
      formatModelResponse(fileResult),
    );

    return {
      type: 'text',
      value: fileContentResponses.join('\n'),
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<
    ToolExample<ReadManyFilesToolInput, ReadManyFilesToolOutput>
  > {
    const exampleContent1 = `import clsx from 'clsx';

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
    const exampleContent2 = `export function snakeCaseToCamelCase(snakeCase: string): string {
  return snakeCase.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
`;

    return [
      {
        input: {
          paths: [
            'src/components/Loader.tsx',
            'src/util/snake-case-to-camel-case.ts',
          ],
        },
        output:
          formatModelResponse({
            path: 'src/components/Loader.tsx',
            content: exampleContent1,
          }) +
          '\n' +
          formatModelResponse({
            path: 'src/util/snake-case-to-camel-case.ts',
            content: exampleContent2,
          }),
      },
    ];
  }
}
