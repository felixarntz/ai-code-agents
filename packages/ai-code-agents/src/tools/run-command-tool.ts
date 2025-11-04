import { z } from 'zod';
import {
  RunCommandResult,
  type CommandLineEnvironmentInterface,
  type ToolConfig,
  type ToolExample,
  type ModelFormattedToolResult,
} from '../types';
import {
  EnvironmentToolBase,
  type EnvironmentToolMetadata,
} from './environment-tool-base';

export const RunCommandToolName = 'run_command';

export type RunCommandToolConfig = ToolConfig;

export const RunCommandToolInput = z.object({
  command: z
    .string()
    .meta({ description: 'The CLI command to run, including all arguments.' }),
});

export type RunCommandToolInput = z.infer<typeof RunCommandToolInput>;

export const RunCommandToolOutput = RunCommandResult;

export type RunCommandToolOutput = z.infer<typeof RunCommandToolOutput>;

/**
 * Formats the command result into a model-friendly response string.
 *
 * @param output - The command result output.
 * @returns The formatted string for model consumption.
 */
function formatCommandResultToModelResponse(output: RunCommandResult) {
  const stdout = !output.stdout.trim()
    ? '(none)'
    : `
\`\`\`
${output.stdout}
\`\`\``;
  const stderr = !output.stderr.trim()
    ? '(none)'
    : `
\`\`\`
${output.stderr}
\`\`\``;

  return `Command: \`${output.command}\`
Exit Code: ${output.exitCode}
Output (stdout): ${stdout}
Error Output (stderr): ${stderr}
`;
}

/**
 * Class for the RunCommand tool.
 *
 * WARNING: This tool can be dangerous if misused. It allows executing arbitrary commands in the environment.
 * Only allow using this tool in sandboxed environments where the potential risks are understood and mitigated.
 */
export class RunCommandTool extends EnvironmentToolBase<
  RunCommandToolConfig,
  RunCommandToolInput,
  RunCommandToolOutput,
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
    RunCommandToolInput,
    RunCommandToolOutput
  > {
    return {
      name: RunCommandToolName,
      description: 'Runs the specific CLI command.',
      inputSchema: RunCommandToolInput,
      outputSchema: RunCommandToolOutput,
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
    env: CommandLineEnvironmentInterface,
    input: RunCommandToolInput,
  ): Promise<RunCommandToolOutput> {
    return env.runCommand(input.command);
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param output - The output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(output: RunCommandToolOutput): ModelFormattedToolResult {
    return {
      type: 'text',
      value: formatCommandResultToModelResponse(output),
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<
    ToolExample<RunCommandToolInput, RunCommandToolOutput>
  > {
    const exampleGitOutput = `diff --git a/src/util/string-utils.ts b/src/util/string-utils.ts
index 1836072..b13adef 100644
--- a/src/util/string-utils.ts
+++ b/src/util/string-utils.ts
@@ -1,3 +1,7 @@
 export function snakeCaseToCamelCase(str: string): string {
   return str.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
 }
+
+export function camelCaseToSnakeCase(str: string): string {
+  return str.replace(/([A-Z])/g, (match) => \`_\${match.toLowerCase()}\`);
+}
`;

    const exampleNpmOutput = `
added 1 package, and changed 1 package in 2s

156 packages are looking for funding
  run \`npm fund\` for details`;

    const exampleMkdirError = `mkdir: src/lib: No such file or directory
`;

    return [
      {
        input: {
          command: 'git --no-pager diff',
        },
        output: formatCommandResultToModelResponse({
          command: 'git --no-pager diff',
          exitCode: 0,
          stdout: exampleGitOutput,
          stderr: '',
        }),
      },
      {
        input: {
          command: 'npm install zod',
        },
        output: formatCommandResultToModelResponse({
          command: 'npm install zod',
          exitCode: 0,
          stdout: exampleNpmOutput,
          stderr: '',
        }),
      },
      {
        input: {
          command: 'mkdir src/lib/api',
        },
        output: formatCommandResultToModelResponse({
          command: 'mkdir src/lib/api',
          exitCode: 1,
          stdout: '',
          stderr: exampleMkdirError,
        }),
      },
    ];
  }
}
