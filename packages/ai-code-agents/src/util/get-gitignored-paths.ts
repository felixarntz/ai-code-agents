import path from 'node:path';
import {
  type CommandLineEnvironmentInterface,
  escapeCommandArg,
} from '@ai-code-agents/environment-utils';

/**
 * Gets the list of paths ignored by Git by reading the closest .gitignore file.
 *
 * @param env - The execution environment to use.
 * @returns A promise that resolves to the list of ignored paths.
 */
export async function getGitIgnoredPaths(
  env: CommandLineEnvironmentInterface,
): Promise<string[]> {
  const gitignorePath = await getClosestGitIgnorePath(env);
  if (!gitignorePath) {
    return [];
  }

  const { stdout: pwd } = await env.runCommand('pwd');
  const currentDir = pwd.trim();
  const gitignoreDir = path.dirname(gitignorePath);

  try {
    const { stdout, exitCode } = await env.runCommand(
      `cat ${escapeCommandArg(gitignorePath)}`,
    );
    if (exitCode !== 0) {
      return [];
    }

    const rawRules = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#')); // Ignore empty lines and comments.

    const relPath = path.relative(gitignoreDir, currentDir);
    if (relPath === '') {
      return rawRules.map((rule) =>
        rule.startsWith('/') ? rule.slice(1) : rule,
      );
    }

    const relPathSegments = relPath.split(path.sep);
    const sanitizedRules: string[] = [];

    for (const rule of rawRules) {
      // A rule is anchored if it starts with / or has a / in the middle.
      const isAnchored =
        rule.startsWith('/') ||
        (rule.includes('/') && rule.indexOf('/') !== rule.length - 1);

      // Rules starting with **/ are effectively non-anchored for our purposes of matching anywhere.
      if (!isAnchored || rule.startsWith('**/')) {
        sanitizedRules.push(rule.startsWith('**/') ? rule.slice(3) : rule);
        continue;
      }

      const normalizedRule = rule.startsWith('/') ? rule.slice(1) : rule;
      const cleanRule = normalizedRule.endsWith('/')
        ? normalizedRule.slice(0, -1)
        : normalizedRule;
      const ruleSegments = cleanRule.split('/');

      let matches = true;
      let i = 0;
      for (; i < relPathSegments.length; i++) {
        if (i >= ruleSegments.length) {
          // Rule is a parent of the current directory (e.g. rule 'packages/' and we are in 'packages/env-utils').
          // This means everything in the current directory is ignored.
          sanitizedRules.push('.');
          matches = false;
          break;
        }

        if (!matchSegment(ruleSegments[i], relPathSegments[i])) {
          matches = false;
          break;
        }
      }

      if (matches) {
        const remaining = ruleSegments.slice(i).join('/');
        if (remaining) {
          sanitizedRules.push(
            normalizedRule.endsWith('/') && !remaining.endsWith('/')
              ? `${remaining}/`
              : remaining,
          );
        } else {
          sanitizedRules.push('.');
        }
      }
    }

    return [...new Set(sanitizedRules)];
  } catch (_error) {
    return [];
  }
}

/**
 * Matches a single path segment against a glob pattern segment.
 *
 * @param pattern - The pattern segment (e.g. 'packages', '*', 'env-*').
 * @param segment - The actual path segment.
 * @returns True if it matches, false otherwise.
 */
function matchSegment(pattern: string, segment: string): boolean {
  if (pattern === '*') {
    return true;
  }
  if (pattern === segment) {
    return true;
  }
  if (pattern.includes('*') || pattern.includes('?')) {
    // Convert glob to regex
    const regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(segment);
  }
  return false;
}

/**
 * Gets the path to the closest .gitignore file.
 *
 * @param env - The execution environment to use.
 * @returns A promise that resolves to the path to the closest .gitignore file, or an empty string if none is found.
 */
async function getClosestGitIgnorePath(
  env: CommandLineEnvironmentInterface,
): Promise<string> {
  const command =
    'd=$PWD; while [[ -n "$d" && ! -f "$d/.gitignore" ]]; do d=${d%/*}; done; [[ -f "$d/.gitignore" ]] && echo "$d/.gitignore"';
  const { stdout } = await env.runCommand(command);
  return stdout.trim();
}
