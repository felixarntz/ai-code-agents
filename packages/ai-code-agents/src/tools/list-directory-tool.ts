import { z } from 'zod';
import {
  type CommandLineEnvironmentInterface,
  type ToolConfig,
  type ToolExample,
  type ModelFormattedToolResult,
} from '../types';
import { escapeCommandArg } from '../util/escape-command-arg';
import {
  EnvironmentToolBase,
  type EnvironmentToolMetadata,
} from './environment-tool-base';

export const ListDirectoryToolName = 'list_directory';

export type ListDirectoryToolConfig = ToolConfig;

export const ListDirectoryToolInput = z.object({
  path: z.string().meta({
    description:
      'The directory path to list, relative to the project directory.',
  }),
});

export type ListDirectoryToolInput = z.infer<typeof ListDirectoryToolInput>;

export const ListDirectoryToolOutput = z.object({
  path: z.string().meta({
    description: 'The directory path that was listed.',
  }),
  files: z.array(z.string()).meta({
    description: 'List of files in the directory.',
  }),
  directories: z.array(z.string()).meta({
    description: 'List of subdirectories in the directory.',
  }),
});

export type ListDirectoryToolOutput = z.infer<typeof ListDirectoryToolOutput>;

/**
 * Class for the ListDirectory tool.
 */
export class ListDirectoryTool extends EnvironmentToolBase<
  ListDirectoryToolConfig,
  ListDirectoryToolInput,
  ListDirectoryToolOutput,
  CommandLineEnvironmentInterface
> {
  /**
   * Returns the metadata for the tool.
   *
   * The name, description, and needsApproval properties are defaults which can be overridden in the constructor.
   *
   * @returns The tool metadata.
   */
  protected getMetadata(): EnvironmentToolMetadata<
    ListDirectoryToolInput,
    ListDirectoryToolOutput
  > {
    return {
      name: ListDirectoryToolName,
      description:
        'Lists all files and directories in the specified directory, differentiating between files and directories. Non-recursive.',
      inputSchema: ListDirectoryToolInput,
      outputSchema: ListDirectoryToolOutput,
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
    env: CommandLineEnvironmentInterface,
    input: ListDirectoryToolInput,
  ): Promise<ListDirectoryToolOutput> {
    const escapedPath = escapeCommandArg(input.path);
    const command = `ls -la ${escapedPath}`;

    const { stdout, stderr, exitCode } = await env.runCommand(command);

    if (exitCode !== 0) {
      throw new Error(
        `Failed to list directory "${input.path}" with command "${command}": ${stderr}`,
      );
    }

    const lines = stdout.split('\n').filter((line) => line.trim() !== '');
    const files: string[] = [];
    const directories: string[] = [];

    // Skip the first line (total) and process each entry
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // ls -la format: permissions links owner group size month day time name
      // First character indicates type: d=directory, -=file, l=symlink, etc.
      const typeChar = line.charAt(0);
      const parts = line.split(/\s+/);
      const name = parts[parts.length - 1];

      // Skip . and .. entries
      if (name === '.' || name === '..') continue;

      if (typeChar === 'd') {
        directories.push(name);
      } else if (typeChar === '-') {
        files.push(name);
      }
      // Ignore other types (symlinks, etc.) for now
    }

    return {
      path: input.path,
      files,
      directories,
    };
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param output - The output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(output: ListDirectoryToolOutput): ModelFormattedToolResult {
    const formatEntries = (entries: string[], type: string) => {
      if (entries.length === 0) {
        return `No ${type} found.`;
      }
      const bulletPoints = entries.map((name) => `- \`${name}\``).join('\n');
      return `${type.charAt(0).toUpperCase() + type.slice(1)}:\n${bulletPoints}`;
    };

    const filesSection = formatEntries(output.files, 'files');
    const directoriesSection = formatEntries(output.directories, 'directories');

    return {
      type: 'text',
      value: `Directory listing for \`${output.path}\`:\n\n${filesSection}\n\n${directoriesSection}`,
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<
    ToolExample<ListDirectoryToolInput, ListDirectoryToolOutput>
  > {
    return [
      {
        input: {
          path: 'src',
        },
        output: `Directory listing for \`src\`:

Files:
- \`index.ts\`
- \`utils.ts\`

Directories:
- \`components\`
- \`hooks\``,
      },
    ];
  }
}
