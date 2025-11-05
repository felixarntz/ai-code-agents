import { z } from 'zod';
import {
  type FilesystemEnvironmentInterface,
  type ToolConfig,
  type ToolExample,
  type ModelFormattedToolResult,
} from '../types';
import {
  EnvironmentToolBase,
  type EnvironmentToolMetadata,
} from './environment-tool-base';

export const EditFileToolName = 'edit_file';

export type EditFileToolConfig = ToolConfig;

export const EditFileToolInput = z.object({
  path: z.string().meta({
    description:
      'The path to the file to edit, relative to the project directory.',
  }),
  oldString: z.string().meta({
    description: 'The exact string to replace in the file.',
  }),
  newString: z.string().meta({
    description: 'The string to replace the old string with.',
  }),
  replaceAll: z.boolean().optional().meta({
    description:
      'Whether to replace all occurrences of the old string. Defaults to false.',
  }),
});

export type EditFileToolInput = z.infer<typeof EditFileToolInput>;

export const EditFileToolOutput = z.object({
  path: z.string().meta({
    description: 'The path to the file that was edited.',
  }),
  oldString: z.string().meta({
    description: 'The old string that was replaced.',
  }),
  newString: z.string().meta({
    description: 'The new string that replaced the old string.',
  }),
  replacements: z.number().meta({
    description: 'The number of replacements made.',
  }),
  message: z.string().meta({
    description: 'A message indicating the result of the edit operation.',
  }),
});

export type EditFileToolOutput = z.infer<typeof EditFileToolOutput>;

/**
 * Escapes special regex characters in a string for literal matching.
 *
 * @param string - The string to escape.
 * @returns The escaped string.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Class for the EditFile tool.
 */
export class EditFileTool extends EnvironmentToolBase<
  EditFileToolConfig,
  EditFileToolInput,
  EditFileToolOutput,
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
    EditFileToolInput,
    EditFileToolOutput
  > {
    return {
      name: EditFileToolName,
      description: 'Edits a file by replacing strings.',
      inputSchema: EditFileToolInput,
      outputSchema: EditFileToolOutput,
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
  protected async executeForEnvironment(
    env: FilesystemEnvironmentInterface,
    input: EditFileToolInput,
  ): Promise<EditFileToolOutput> {
    const { path, oldString, newString, replaceAll = false } = input;

    const readResult = await env.readFile(path);
    let content = readResult.content;
    let replacements = 0;

    if (replaceAll) {
      const escapedOldString = escapeRegExp(oldString);
      const regex = new RegExp(escapedOldString, 'g');
      const matches = content.match(regex);
      replacements = matches ? matches.length : 0;
      content = content.replace(regex, newString);
    } else {
      const index = content.indexOf(oldString);
      if (index !== -1) {
        content =
          content.substring(0, index) +
          newString +
          content.substring(index + oldString.length);
        replacements = 1;
      }
    }

    await env.writeFile(path, content);

    const message =
      replacements > 0
        ? `Successfully made ${replacements} replacement(s) in file.`
        : 'No replacements made - old string not found.';

    return {
      path,
      oldString,
      newString,
      replacements,
      message,
    };
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param output - The output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(output: EditFileToolOutput): ModelFormattedToolResult {
    return {
      type: 'text',
      value: `Edited file \`${output.path}\` with ${output.replacements} replacement(s).`,
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<ToolExample<EditFileToolInput, EditFileToolOutput>> {
    return [
      {
        input: {
          path: 'src/example.ts',
          oldString: 'console.log("hello");',
          newString: 'console.log("world");',
          replaceAll: false,
        },
        output: {
          path: 'src/example.ts',
          oldString: 'console.log("hello");',
          newString: 'console.log("world");',
          replacements: 1,
          message: 'Successfully made 1 replacement(s) in file.',
        },
      },
      {
        input: {
          path: 'src/example.ts',
          oldString: 'var',
          newString: 'let',
          replaceAll: true,
        },
        output: {
          path: 'src/example.ts',
          oldString: 'var',
          newString: 'let',
          replacements: 3,
          message: 'Successfully made 3 replacement(s) in file.',
        },
      },
    ];
  }
}
