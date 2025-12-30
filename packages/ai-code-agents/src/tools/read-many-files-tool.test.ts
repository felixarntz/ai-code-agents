import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockFilesystemEnvironment } from '../environments/mock-filesystem-environment';
import {
  ReadManyFilesTool,
  ReadManyFilesToolName,
  type ReadManyFilesToolOutput,
} from './read-many-files-tool';

describe('ReadManyFilesTool', () => {
  let mockFsEnv: MockFilesystemEnvironment;
  let tool: ReadManyFilesTool;

  beforeEach(() => {
    mockFsEnv = new MockFilesystemEnvironment();
    tool = new ReadManyFilesTool(mockFsEnv);
    vi.spyOn(mockFsEnv, 'readFile');
  });

  it('should return metadata', () => {
    expect(tool.name).toBe(ReadManyFilesToolName);
    expect(tool.description).toBe(
      'Reads the contents of the files at the specified paths.',
    );
    // Check if the schemas are correctly defined (not their parsing behavior here)
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(false);
  });

  it('should read multiple files successfully', async () => {
    const file1Content = 'Content of file 1.';
    const file2Content = 'Content of file 2.';

    vi.mocked(mockFsEnv.readFile).mockImplementation(async (path: string) => {
      if (path === 'path/to/file1.txt') {
        return { path, content: file1Content };
      }
      if (path === 'path/to/file2.js') {
        return { path, content: file2Content };
      }
      throw new Error(`File not found: ${path}`);
    });

    const input = { paths: ['path/to/file1.txt', 'path/to/file2.js'] };
    const output = await tool.execute(input, {
      toolCallId: 'test',
      messages: [],
    });

    expect(mockFsEnv.readFile).toHaveBeenCalledTimes(2);
    expect(mockFsEnv.readFile).toHaveBeenCalledWith('path/to/file1.txt');
    expect(mockFsEnv.readFile).toHaveBeenCalledWith('path/to/file2.js');
    expect(output).toEqual({
      'path/to/file1.txt': { path: 'path/to/file1.txt', content: file1Content },
      'path/to/file2.js': { path: 'path/to/file2.js', content: file2Content },
    });
  });

  it('should read a single file successfully', async () => {
    const fileContent = 'Single file content.';

    vi.mocked(mockFsEnv.readFile).mockResolvedValue({
      path: 'single.txt',
      content: fileContent,
    });

    const input = { paths: ['single.txt'] };
    const output = await tool.execute(input, {
      toolCallId: 'test',
      messages: [],
    });

    expect(mockFsEnv.readFile).toHaveBeenCalledTimes(1);
    expect(mockFsEnv.readFile).toHaveBeenCalledWith('single.txt');
    expect(output).toEqual({
      'single.txt': { path: 'single.txt', content: fileContent },
    });
  });

  it('should handle an empty file', async () => {
    const emptyContent = '';

    vi.mocked(mockFsEnv.readFile).mockResolvedValue({
      path: 'empty.txt',
      content: emptyContent,
    });

    const input = { paths: ['empty.txt'] };
    const output = await tool.execute(input, {
      toolCallId: 'test',
      messages: [],
    });

    expect(mockFsEnv.readFile).toHaveBeenCalledTimes(1);
    expect(mockFsEnv.readFile).toHaveBeenCalledWith('empty.txt');
    expect(output).toEqual({
      'empty.txt': { path: 'empty.txt', content: emptyContent },
    });
  });

  it('should propagate error if readFile fails for one of the files', async () => {
    const file1Content = 'Content of file 1.';
    const errorMessage = 'Permission denied.';

    vi.mocked(mockFsEnv.readFile).mockImplementation(async (path: string) => {
      if (path === 'path/to/file1.txt') {
        return { path, content: file1Content };
      }
      if (path === 'path/to/non-existent.txt') {
        throw new Error(errorMessage);
      }
      return { path, content: '' };
    });

    const input = { paths: ['path/to/file1.txt', 'path/to/non-existent.txt'] };
    await expect(
      tool.execute(input, { toolCallId: 'test', messages: [] }),
    ).rejects.toThrow(errorMessage);

    expect(mockFsEnv.readFile).toHaveBeenCalledTimes(2);
    expect(mockFsEnv.readFile).toHaveBeenCalledWith('path/to/file1.txt');
    expect(mockFsEnv.readFile).toHaveBeenCalledWith('path/to/non-existent.txt');
  });

  it('should format model output for multiple files', () => {
    const file1Result: ReadManyFilesToolOutput[string] = {
      path: 'src/file1.ts',
      content: 'console.log("hello");',
    };
    const file2Result: ReadManyFilesToolOutput[string] = {
      path: 'README.md',
      content: '# My Project',
    };
    const output = {
      'src/file1.ts': file1Result,
      'README.md': file2Result,
    };

    const modelOutput = tool.toModelOutput({
      toolCallId: 'test-call',
      input: {
        paths: ['src/file1.ts', 'README.md'],
      },
      output,
    });
    expect(modelOutput.type).toBe('text');
    expect(modelOutput.value).toContain(
      'File: `src/file1.ts`\nContent:\n```typescript\nconsole.log("hello");\n```',
    );
    expect(modelOutput.value).toContain(
      'File: `README.md`\nContent:\n```markdown\n# My Project\n```',
    );
  });

  it('should format model output for a single file', () => {
    const fileResult: ReadManyFilesToolOutput[string] = {
      path: 'src/single.js',
      content: 'function test() {}',
    };
    const output = {
      'src/single.js': fileResult,
    };

    const modelOutput = tool.toModelOutput({
      toolCallId: 'test-call',
      input: {
        paths: ['src/single.js'],
      },
      output,
    });
    expect(modelOutput.type).toBe('text');
    expect(modelOutput.value).toBe(
      'File: `src/single.js`\nContent:\n```javascript\nfunction test() {}\n```\n',
    );
  });

  it('should return empty string for model output when no files are read', () => {
    const output = {};
    const modelOutput = tool.toModelOutput({
      toolCallId: 'test-call',
      input: {
        paths: [],
      },
      output,
    });
    expect(modelOutput.type).toBe('text');
    expect(modelOutput.value).toBe('');
  });

  it('should return examples', () => {
    expect(tool.examples.length).toBeGreaterThan(0);
    const example = tool.examples[0];
    expect(example.input.paths).toEqual([
      'src/components/Loader.tsx',
      'src/util/snake-case-to-camel-case.ts',
    ]);
    expect(example.output).toContain('File: `src/components/Loader.tsx`');
    expect(example.output).toContain(
      'File: `src/util/snake-case-to-camel-case.ts`',
    );
  });
});
