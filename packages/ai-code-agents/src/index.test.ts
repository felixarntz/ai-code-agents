import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import * as indexExports from './index';

describe('index', () => {
  it('should export all tool classes and name constants from the tools directory', () => {
    const toolsDir = path.resolve(__dirname, 'tools');
    const toolFiles = fs
      .readdirSync(toolsDir)
      .filter(
        (file) =>
          file.endsWith('.ts') &&
          !file.endsWith('.test.ts') &&
          !file.includes('-base'),
      );

    const expectedExports = toolFiles.flatMap((file) => {
      const toolNamePascalCase = file
        .replace('.ts', '')
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      return [toolNamePascalCase, `${toolNamePascalCase}Name`];
    });

    const actualExportNames = Object.keys(indexExports);

    for (const expectedExport of expectedExports) {
      expect(actualExportNames).toContain(expectedExport);
    }
  });

  it('should export all environment classes and name constants from the environments directory', () => {
    const environmentsDir = path.resolve(__dirname, 'environments');
    const environmentFiles = fs
      .readdirSync(environmentsDir)
      .filter(
        (file) =>
          file.endsWith('.ts') &&
          !file.endsWith('.test.ts') &&
          !file.includes('-base'),
      );

    const expectedExports = environmentFiles.flatMap((file) => {
      const environmentNamePascalCase = file
        .replace('.ts', '')
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      return [environmentNamePascalCase, `${environmentNamePascalCase}Name`];
    });

    const actualExportNames = Object.keys(indexExports);

    for (const expectedExport of expectedExports) {
      expect(actualExportNames).toContain(expectedExport);
    }
  });
});
