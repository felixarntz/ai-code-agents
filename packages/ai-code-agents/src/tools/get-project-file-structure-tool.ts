import { z } from 'zod';
import {
  EnvironmentToolBase,
  type EnvironmentToolMetadata,
  type CommandLineEnvironmentInterface,
  type ToolConfig,
  type ToolExample,
  type ModelToolResultToFormat,
  type ModelFormattedToolResult,
  escapeCommandArg,
} from '@ai-code-agents/environment-utils';
import { buildTreeFromFiles } from '../util/build-tree-from-files';
import { getGitIgnoredPaths } from '../util/get-gitignored-paths';

export const GetProjectFileStructureToolName = 'get_project_file_structure';

export type GetProjectFileStructureToolConfig = ToolConfig;

export const GetProjectFileStructureToolInput = z.object({
  path: z.string().optional().meta({
    description:
      'Root path to list files from, relative to the project directory. Defaults to ".".',
  }),
  excludeGitIgnored: z.boolean().optional().meta({
    description: 'Whether to exclude files ignored by Git. Defaults to true.',
  }),
});

export type GetProjectFileStructureToolInput = z.infer<
  typeof GetProjectFileStructureToolInput
>;

export const GetProjectFileStructureToolOutput = z.object({
  files: z.array(z.string()).meta({
    description: 'List of all file paths found, relative to the root path.',
  }),
  excludeGitIgnored: z.boolean().meta({
    description: 'Whether files ignored by Git were excluded.',
  }),
});

export type GetProjectFileStructureToolOutput = z.infer<
  typeof GetProjectFileStructureToolOutput
>;

/**
 * Class for the GetProjectFileStructure tool.
 */
export class GetProjectFileStructureTool extends EnvironmentToolBase<
  GetProjectFileStructureToolConfig,
  GetProjectFileStructureToolInput,
  GetProjectFileStructureToolOutput,
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
    GetProjectFileStructureToolInput,
    GetProjectFileStructureToolOutput
  > {
    return {
      name: GetProjectFileStructureToolName,
      description:
        'Recursively lists all files in the project directory and formats them as a tree structure.',
      inputSchema: GetProjectFileStructureToolInput,
      outputSchema: GetProjectFileStructureToolOutput,
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
    input: GetProjectFileStructureToolInput,
  ): Promise<GetProjectFileStructureToolOutput> {
    const { path = '.', excludeGitIgnored = true } = input;
    const escapedPath = escapeCommandArg(path);

    // The `find` command needs to be executed from the project root to ensure
    // paths are relative to the project root.
    let command = `find ${escapedPath} -type f`;

    // Exclude .gitignore patterns if requested.
    if (excludeGitIgnored) {
      const gitIgnoredPaths = await getGitIgnoredPaths(env);

      for (const gitIgnoredPath of gitIgnoredPaths) {
        // If the path doesn't end in a slash, it could be a file or a directory. Otherwise, it's a directory.
        if (!gitIgnoredPath.endsWith('/')) {
          const escapedPath = escapeCommandArg(`*/${gitIgnoredPath}/*`);
          command += ` -not -name ${escapeCommandArg(gitIgnoredPath)} -not -path ${escapedPath}`;
        } else {
          const escapedPath = escapeCommandArg(`*/${gitIgnoredPath}*`);
          command += ` -not -path ${escapedPath}`;
        }
      }
    }

    command += ' | sort';

    const { stdout, stderr, exitCode } = await env.runCommand(command);

    if (exitCode !== 0) {
      throw new Error(
        `Failed to get project file structure with command "${command}": ${stderr}`,
      );
    }

    const files = stdout
      .split('\n')
      .map((path) => path.trim())
      .filter(Boolean); // Filter out empty strings.

    const trimInitialDotSlash = (path: string) =>
      path.startsWith('./') ? path.slice(2) : path;

    return {
      files: files.map(trimInitialDotSlash),
      excludeGitIgnored,
    };
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param options - The tool result, including the output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(
    options: ModelToolResultToFormat<
      GetProjectFileStructureToolInput,
      GetProjectFileStructureToolOutput
    >,
  ): ModelFormattedToolResult {
    const { output } = options;

    const tree = buildTreeFromFiles(output.files);

    if (!tree) {
      return {
        type: 'text',
        value: 'No files found.',
      };
    }

    return {
      type: 'text',
      value: tree,
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<
    ToolExample<
      GetProjectFileStructureToolInput,
      GetProjectFileStructureToolOutput
    >
  > {
    return [
      {
        input: {},
        output: `├── **src/**
│   ├── **components/**
│   │   ├── **Button.js**
│   │   └── **Header.js**
│   └── **index.js**
├── **tests/**
│   └── **test_runner.py**
├── .gitignore
├── README.md
└── package.json`,
      },
    ];
  }
}
