/**
 * External dependencies
 */
import path from 'node:path';

export type ProgrammingLanguage = {
  identifier: string;
  name: string;
  fileExtensions: string[];
};

const jsLanguage: ProgrammingLanguage = {
  identifier: 'javascript',
  name: 'JavaScript',
  fileExtensions: ['js', 'jsx'],
};

const tsLanguage: ProgrammingLanguage = {
  identifier: 'typescript',
  name: 'TypeScript',
  fileExtensions: ['ts', 'tsx'],
};

const ymlLanguage: ProgrammingLanguage = {
  identifier: 'yaml',
  name: 'YAML',
  fileExtensions: ['yml', 'yaml'],
};

/**
 * Language detection by file extension.
 */
const EXTENSION_TO_LANGUAGE: Record<string, ProgrammingLanguage> = {
  ts: tsLanguage,
  tsx: tsLanguage,
  js: jsLanguage,
  jsx: jsLanguage,
  py: {
    identifier: 'python',
    name: 'Python',
    fileExtensions: ['py'],
  },
  java: {
    identifier: 'java',
    name: 'Java',
    fileExtensions: ['java'],
  },
  c: {
    identifier: 'c',
    name: 'C',
    fileExtensions: ['c'],
  },
  cpp: {
    identifier: 'cpp',
    name: 'C++',
    fileExtensions: ['cpp'],
  },
  cs: {
    identifier: 'chsarp',
    name: 'C#',
    fileExtensions: ['cs'],
  },
  go: {
    identifier: 'go',
    name: 'Go',
    fileExtensions: ['go'],
  },
  rs: {
    identifier: 'rust',
    name: 'Rust',
    fileExtensions: ['rs'],
  },
  php: {
    identifier: 'php',
    name: 'PHP',
    fileExtensions: ['php'],
  },
  rb: {
    identifier: 'ruby',
    name: 'Ruby',
    fileExtensions: ['rb'],
  },
  swift: {
    identifier: 'swift',
    name: 'Swift',
    fileExtensions: ['swift'],
  },
  kt: {
    identifier: 'kotlin',
    name: 'Kotlin',
    fileExtensions: ['kt'],
  },
  scala: {
    identifier: 'scala',
    name: 'Scala',
    fileExtensions: ['scala'],
  },
  html: {
    identifier: 'html',
    name: 'HTML',
    fileExtensions: ['html'],
  },
  css: {
    identifier: 'css',
    name: 'CSS',
    fileExtensions: ['css'],
  },
  sass: {
    identifier: 'sass',
    name: 'Sass',
    fileExtensions: ['sass'],
  },
  scss: {
    identifier: 'scss',
    name: 'SCSS',
    fileExtensions: ['scss'],
  },
  less: {
    identifier: 'less',
    name: 'Less',
    fileExtensions: ['less'],
  },
  json: {
    identifier: 'json',
    name: 'JSON',
    fileExtensions: ['json'],
  },
  md: {
    identifier: 'markdown',
    name: 'Markdown',
    fileExtensions: ['md'],
  },
  toml: {
    identifier: 'toml',
    name: 'TOML',
    fileExtensions: ['toml'],
  },
  yml: ymlLanguage,
  yaml: ymlLanguage,
  xml: {
    identifier: 'xml',
    name: 'XML',
    fileExtensions: ['xml'],
  },
  sql: {
    identifier: 'sql',
    name: 'SQL',
    fileExtensions: ['sql'],
  },
  graphql: {
    identifier: 'graphql',
    name: 'GraphQL',
    fileExtensions: ['graphql'],
  },
  sh: {
    identifier: 'bash',
    name: 'Shell',
    fileExtensions: ['sh'],
  },
  ps1: {
    identifier: 'bash',
    name: 'PowerShell',
    fileExtensions: ['ps1'],
  },
};

/**
 * Returns programming language information for a file path.
 *
 * @param filePath - File path.
 * @returns Programming language information, or null if none could be identified.
 */
function getLanguageFromFilePath(
  filePath: string,
): ProgrammingLanguage | undefined {
  const extension = path.extname(filePath).slice(1).toLowerCase() || '';
  return EXTENSION_TO_LANGUAGE[extension];
}

/**
 * Returns the programming language identifier for a file path.
 *
 * @param filePath - File path.
 * @returns Programming language identifier, or empty string if none could be identified.
 */
export function getLanguageIdentifierFromFilePath(filePath: string): string {
  const language = getLanguageFromFilePath(filePath);
  return language ? language.identifier : '';
}
