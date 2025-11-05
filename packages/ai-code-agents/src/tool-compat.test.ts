import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import * as toolCompat from './tool-compat';

describe('tool-compat', () => {
  it('should have a create*Tool function for every tool in the tools directory', () => {
    const toolsDir = path.resolve(__dirname, 'tools');
    const toolFiles = fs
      .readdirSync(toolsDir)
      .filter(
        (file) =>
          file.endsWith('.ts') &&
          !file.endsWith('.test.ts') &&
          !file.includes('-base'),
      );

    const expectedFunctionNames = toolFiles.map((file) => {
      const toolNamePascalCase = file
        .replace('.ts', '')
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      return `create${toolNamePascalCase}`;
    });

    const actualFunctionNames = Object.keys(toolCompat);

    for (const expectedFunctionName of expectedFunctionNames) {
      expect(actualFunctionNames).toContain(expectedFunctionName);
    }
  });
});
