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
  validateRelativePath,
} from '@ai-code-agents/environment-utils';
import { globToRegExp } from '../util/glob-to-reg-exp';

export const GlobToolName = 'glob';

export type GlobToolConfig = ToolConfig;

export const GlobToolInput = z.object({
  searchPattern: z.string().meta({
    description:
      'The glob pattern to search for, relative to the search path / project directory (e.g. "**/*.ts", "docs/*.md").',
  }),
  searchPath: z.string().optional().meta({
    description:
      'The path to search within, relative to the project directory. Defaults to the project directory.',
  }),
  excludeGitIgnored: z.boolean().optional().meta({
    description: 'Whether to exclude files ignored by Git. Defaults to true.',
  }),
});

export type GlobToolInput = z.infer<typeof GlobToolInput>;

export const GlobToolOutput = z.object({
  searchPattern: z.string().meta({
    description: 'The glob pattern that was searched for.',
  }),
  searchPath: z.string().meta({
    description: 'The path that was searched within.',
  }),
  excludeGitIgnored: z.boolean().meta({
    description: 'Whether files ignored by Git were excluded.',
  }),
  matchingPaths: z.array(z.string()).meta({
    description:
      'The list of file paths that matched the glob search, relative to the project directory.',
  }),
});

export type GlobToolOutput = z.infer<typeof GlobToolOutput>;

/**
 * Class for the Glob tool.
 */
export class GlobTool extends EnvironmentToolBase<
  GlobToolConfig,
  GlobToolInput,
  GlobToolOutput,
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
    GlobToolInput,
    GlobToolOutput
  > {
    return {
      name: GlobToolName,
      description:
        'Runs a glob search to find matching file paths in the project.',
      inputSchema: GlobToolInput,
      outputSchema: GlobToolOutput,
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
    input: GlobToolInput,
  ): Promise<GlobToolOutput> {
    const { searchPattern, searchPath = '', excludeGitIgnored = true } = input;

    if (searchPattern.startsWith('/')) {
      throw new Error(
        'The search pattern must not start with a forward slash.',
      );
    }

    if (searchPath) {
      validateRelativePath(searchPath);
    }

    const untrailingslashedSearchPath =
      searchPath === '' ? '.' : searchPath.replace(/\/+$/, '');

    const escapedSearchPath = escapeCommandArg(untrailingslashedSearchPath);

    // The `find` command needs to be executed from the project root to ensure
    // paths are relative to the project root.
    let command = `find ${escapedSearchPath} -type f`;

    // Exclude .gitignore patterns if requested.
    if (excludeGitIgnored) {
      let gitIgnoredPaths: string[] = [];
      try {
        const { content: gitignoreContent } = await env.readFile('.gitignore');
        gitIgnoredPaths = gitignoreContent
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('#')); // Ignore empty lines and comments.
      } catch (_error) {
        // Ignore errors, e.g. if .gitignore does not exist.
      }

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

    const { stdout, stderr, exitCode } = await env.runCommand(command);

    if (exitCode !== 0) {
      throw new Error(
        `Failed to glob files with command "${command}": ${stderr}`,
      );
    }

    const matchingPaths = stdout
      .split('\n')
      .map((path) => path.trim())
      .filter(Boolean); // Filter out empty strings.

    const trimInitialDotSlash = (path: string) =>
      path.startsWith('./') ? path.slice(2) : path;

    if (searchPattern !== '' && searchPattern !== '**') {
      const combinedPattern = `${untrailingslashedSearchPath}/${searchPattern}`;

      const regExp = globToRegExp(combinedPattern);
      const filteredMatchingPaths = matchingPaths.filter((path) =>
        regExp.test(path),
      );

      return {
        searchPattern,
        searchPath,
        excludeGitIgnored,
        matchingPaths: filteredMatchingPaths.map(trimInitialDotSlash),
      };
    }

    return {
      searchPattern,
      searchPath,
      excludeGitIgnored,
      matchingPaths: matchingPaths.map(trimInitialDotSlash),
    };
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param options - The tool result, including the output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(
    options: ModelToolResultToFormat<GlobToolInput, GlobToolOutput>,
  ): ModelFormattedToolResult {
    const { output } = options;

    if (output.matchingPaths.length === 0) {
      return {
        type: 'text',
        value: 'No matching files found.',
      };
    }

    const bulletPoints = output.matchingPaths
      .map((path) => `- \`${path}\``)
      .join('\n');

    return {
      type: 'text',
      value: `Matching files:
${bulletPoints}
`,
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<ToolExample<GlobToolInput, GlobToolOutput>> {
    return [
      {
        input: {
          searchPattern: 'src/**/*.tsx',
        },
        output: `Matching files:
- \`src/app/page.tsx\`
- \`src/components/chart.tsx\`
- \`src/components/footer.tsx\`
- \`src/components/header.tsx\`
`,
      },
      {
        input: {
          searchPattern: '*',
          searchPath: 'packages/my-project',
        },
        output: `Matching files:
- \`packages/my-project/package.json\`
- \`packages/my-project/README.md\`
- \`packages/my-project/tsconfig.json\`
- \`packages/my-project/vitest.config.ts\`
`,
      },
    ];
  }
}
