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
import { GlobTool } from './glob-tool';

export const GrepToolName = 'grep';

export type GrepToolConfig = ToolConfig;

export const GrepToolInput = z.object({
  regexpPattern: z.string().meta({
    description:
      'The regular expression pattern to search for in file contents.',
  }),
  searchPattern: z.string().optional().meta({
    description:
      'The glob pattern to filter which files are searched (e.g. "**/*.ts"). If omitted, searches all files.',
  }),
  searchPath: z.string().optional().meta({
    description:
      'The path to search within, relative to the project directory. Defaults to the project directory.',
  }),
  contextLines: z.number().int().nonnegative().optional().meta({
    description:
      'The number of context lines to include before and after each match.',
  }),
});

export type GrepToolInput = z.infer<typeof GrepToolInput>;

const GrepMatch = z.object({
  path: z.string().meta({
    description:
      'The path to the file containing the match, relative to the project directory.',
  }),
  lineNumber: z.number().int().meta({
    description: 'The line number of the match (1-based).',
  }),
  line: z.string().meta({
    description: 'The content of the matching line.',
  }),
  beforeContext: z.array(z.string()).optional().meta({
    description: 'Lines of context before the match.',
  }),
  afterContext: z.array(z.string()).optional().meta({
    description: 'Lines of context after the match.',
  }),
});

export type GrepMatch = z.infer<typeof GrepMatch>;

export const GrepToolOutput = z.object({
  regexpPattern: z.string().meta({
    description: 'The regular expression pattern that was searched for.',
  }),
  searchPattern: z.string().optional().meta({
    description: 'The glob pattern used to filter files.',
  }),
  searchPath: z.string().optional().meta({
    description: 'The path that was searched within.',
  }),
  contextLines: z.number().optional().meta({
    description: 'The number of context lines included.',
  }),
  matches: z.array(GrepMatch).meta({
    description: 'The list of matches found.',
  }),
});

export type GrepToolOutput = z.infer<typeof GrepToolOutput>;

/**
 * Class for the Grep tool.
 */
export class GrepTool extends EnvironmentToolBase<
  GrepToolConfig,
  GrepToolInput,
  GrepToolOutput,
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
    GrepToolInput,
    GrepToolOutput
  > {
    return {
      name: GrepToolName,
      description:
        'Searches for a regular expression pattern within the content of files in the project.',
      inputSchema: GrepToolInput,
      outputSchema: GrepToolOutput,
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
    input: GrepToolInput,
  ): Promise<GrepToolOutput> {
    const {
      regexpPattern,
      searchPattern,
      searchPath = '',
      contextLines = 0,
    } = input;

    if (searchPath) {
      validateRelativePath(searchPath);
    }

    // Use GlobTool to find files to search.
    const globTool = new GlobTool(env);
    const globResult = await globTool.execute(
      {
        searchPattern: searchPattern || '**/*',
        searchPath,
      },
      {} as never,
    );

    const filesToSearch = globResult.matchingPaths;

    if (filesToSearch.length === 0) {
      return {
        regexpPattern,
        searchPattern,
        searchPath,
        contextLines,
        matches: [],
      };
    }

    // Batch files to avoid command line length limits.
    const BATCH_SIZE = 50;
    const matches: GrepMatch[] = [];

    for (let i = 0; i < filesToSearch.length; i += BATCH_SIZE) {
      const batch = filesToSearch.slice(i, i + BATCH_SIZE);
      const escapedFilePaths = batch.map(escapeCommandArg).join(' ');

      // grep options:
      // -n: print line number
      // -H: print file name
      // -I: ignore binary files
      // -E: extended regex
      const command = `grep -n -H -I -E ${escapeCommandArg(regexpPattern)} ${escapedFilePaths}`;

      const { stdout, exitCode } = await env.runCommand(command);

      // exitCode 0 means matches found.
      // exitCode 1 means no matches found.
      // exitCode > 1 means error.
      if (exitCode > 1) {
        throw new Error(`Failed to execute grep command "${command}".`);
      }

      if (stdout) {
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse grep output: filename:lineNumber:content
          // Note: filename or content might contain colons.
          // Since we use -H, it always starts with filename.
          // We know the filenames we passed in, but grep might output them relative to CWD.
          // However, since we passed relative paths to grep, it should output relative paths.

          const firstColonIndex = line.indexOf(':');
          if (firstColonIndex === -1) continue;

          const secondColonIndex = line.indexOf(':', firstColonIndex + 1);
          if (secondColonIndex === -1) continue;

          const filePath = line.substring(0, firstColonIndex);
          const lineNumberStr = line.substring(
            firstColonIndex + 1,
            secondColonIndex,
          );
          const content = line.substring(secondColonIndex + 1);

          const lineNumber = parseInt(lineNumberStr, 10);
          if (isNaN(lineNumber)) continue;

          matches.push({
            path: filePath,
            lineNumber,
            line: content,
          });
        }
      }
    }

    // If context is requested, we need to read the files.
    if (contextLines > 0 && matches.length > 0) {
      // Group matches by file to minimize file reads.
      const matchesByFile = new Map<string, GrepMatch[]>();
      for (const match of matches) {
        if (!matchesByFile.has(match.path)) {
          matchesByFile.set(match.path, []);
        }
        matchesByFile.get(match.path)!.push(match);
      }

      for (const [filePath, fileMatches] of matchesByFile) {
        try {
          const { content } = await env.readFile(filePath);
          const lines = content.split('\n');

          for (const match of fileMatches) {
            const lineIndex = match.lineNumber - 1;
            const start = Math.max(0, lineIndex - contextLines);
            const end = Math.min(lines.length, lineIndex + contextLines + 1);

            match.beforeContext = lines.slice(start, lineIndex);
            match.afterContext = lines.slice(lineIndex + 1, end);
          }
        } catch (_error) {
          // Ignore errors reading file for context.
        }
      }
    }

    return {
      regexpPattern,
      searchPattern,
      searchPath,
      contextLines,
      matches,
    };
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param options - The tool result, including the output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(
    options: ModelToolResultToFormat<GrepToolInput, GrepToolOutput>,
  ): ModelFormattedToolResult {
    const { output } = options;

    if (output.matches.length === 0) {
      return {
        type: 'text',
        value: 'No matches found.',
      };
    }

    let result = `Found ${output.matches.length} matches:\n`;

    // Group by file for display
    const matchesByFile = new Map<string, GrepMatch[]>();
    for (const match of output.matches) {
      if (!matchesByFile.has(match.path)) {
        matchesByFile.set(match.path, []);
      }
      matchesByFile.get(match.path)!.push(match);
    }

    for (const [filePath, matches] of matchesByFile) {
      result += `\nFile: ${filePath}\n`;
      for (const match of matches) {
        if (match.beforeContext && match.beforeContext.length > 0) {
          match.beforeContext.forEach((line, idx) => {
            result += `  ${match.lineNumber - match.beforeContext!.length + idx}: ${line}\n`;
          });
        }
        result += `> ${match.lineNumber}: ${match.line}\n`;
        if (match.afterContext && match.afterContext.length > 0) {
          match.afterContext.forEach((line, idx) => {
            result += `  ${match.lineNumber + 1 + idx}: ${line}\n`;
          });
        }
        if (output.contextLines && output.contextLines > 0) {
          result += '---\n';
        }
      }
    }

    return {
      type: 'text',
      value: result,
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<ToolExample<GrepToolInput, GrepToolOutput>> {
    return [
      {
        input: {
          regexpPattern: 'interface.*Tool',
          searchPattern: 'src/**/*.ts',
        },
        output: `Found 2 matches:

File: src/types.ts
> 120: export interface ToolInterface<ToolInputType, ToolOutputType> {
> 135: export interface EnvironmentToolInterface<

File: src/tools/tool-base.ts
> 10: export abstract class ToolBase<
`,
      },
      {
        input: {
          regexpPattern: 'TODO',
          contextLines: 1,
        },
        output: `Found 1 matches:

File: src/index.ts
  10: // Some code before
> 11: // TODO: Implement feature X
  12: // Some code after
`,
      },
    ];
  }
}
