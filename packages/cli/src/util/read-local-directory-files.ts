import path from 'node:path';
import {
  UnsafeLocalEnvironment,
  GetProjectFileStructureTool,
  ReadManyFilesTool,
} from 'ai-code-agents';

/**
 * Reads all files from a local directory, excluding gitignored files.
 *
 * @param directoryPath - The absolute path to the directory to read.
 * @returns A record mapping file paths to their contents.
 */
export const readLocalDirectoryFiles = async (
  directoryPath: string,
): Promise<Record<string, string>> => {
  const env = new UnsafeLocalEnvironment({ directoryPath });

  const getProjectFileStructureTool = new GetProjectFileStructureTool(env);
  const readManyFilesTool = new ReadManyFilesTool(env);

  const { files } = await getProjectFileStructureTool.execute(
    { excludeGitIgnored: true },
    {} as never,
  );

  if (files.length === 0) {
    return {};
  }

  const readResult = await readManyFilesTool.execute(
    { paths: files },
    {} as never,
  );

  const result: Record<string, string> = {};
  for (const [, fileResult] of Object.entries(readResult)) {
    const relativePath = path.relative(
      directoryPath,
      path.resolve(directoryPath, fileResult.path),
    );
    result[relativePath] = fileResult.content;
  }

  return result;
};
