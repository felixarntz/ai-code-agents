import { describe, it, expect } from 'vitest';
import { buildTreeFromFiles } from './build-tree-from-files';

describe('buildTreeFromFiles', () => {
  it('should return empty string for empty array', () => {
    expect(buildTreeFromFiles([])).toBe('');
  });

  it('should build tree for single file', () => {
    const files = ['file.txt'];
    const expected = '└── **file.txt**';
    expect(buildTreeFromFiles(files)).toBe(expected);
  });

  it('should build tree for single file in directory', () => {
    const files = ['dir/file.txt'];
    const expected = '└── **dir**\n    └── **file.txt**';
    expect(buildTreeFromFiles(files)).toBe(expected);
  });

  it('should build tree for multiple files in same directory', () => {
    const files = ['dir/file1.txt', 'dir/file2.txt'];
    const expected =
      '└── **dir**\n    ├── **file1.txt**\n    └── **file2.txt**';
    expect(buildTreeFromFiles(files)).toBe(expected);
  });

  it('should build tree for nested directories', () => {
    const files = ['dir/subdir/file.txt'];
    const expected =
      '└── **dir**\n    └── **subdir**\n        └── **file.txt**';
    expect(buildTreeFromFiles(files)).toBe(expected);
  });

  it('should sort files alphabetically', () => {
    const files = ['b.txt', 'a.txt'];
    const expected = '├── **a.txt**\n└── **b.txt**';
    expect(buildTreeFromFiles(files)).toBe(expected);
  });

  it('should handle files with common prefixes', () => {
    const files = ['abc.txt', 'abcd.txt'];
    const expected = '├── **abc.txt**\n└── **abcd.txt**';
    expect(buildTreeFromFiles(files)).toBe(expected);
  });

  it('should build complex tree structure', () => {
    const files = [
      'src/index.ts',
      'src/util/helper.ts',
      'src/util/parser.ts',
      'README.md',
      'package.json',
    ];
    const expected =
      '├── **README.md**\n├── **package.json**\n└── **src**\n    ├── **index.ts**\n    └── **util**\n        ├── **helper.ts**\n        └── **parser.ts**';
    expect(buildTreeFromFiles(files)).toBe(expected);
  });

  it('should handle deep nesting', () => {
    const files = ['a/b/c/d/file.txt'];
    const expected =
      '└── **a**\n    └── **b**\n        └── **c**\n            └── **d**\n                └── **file.txt**';
    expect(buildTreeFromFiles(files)).toBe(expected);
  });

  it('should handle multiple files in nested directories', () => {
    const files = ['dir1/file1.txt', 'dir1/sub/file2.txt', 'dir2/file3.txt'];
    const expected =
      '├── **dir1**\n│   ├── **file1.txt**\n│   └── **sub**\n│       └── **file2.txt**\n└── **dir2**\n    └── **file3.txt**';
    expect(buildTreeFromFiles(files)).toBe(expected);
  });
});
