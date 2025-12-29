import { describe, it, expect } from 'vitest';
import { truncateString, truncateObject } from './truncate';

describe('truncateString', () => {
  describe('single-line strings', () => {
    it('returns strings under 300 characters unchanged', () => {
      const str = 'a'.repeat(299);
      expect(truncateString(str)).toBe(str);
    });

    it('returns exactly 300 character strings unchanged', () => {
      const str = 'a'.repeat(300);
      expect(truncateString(str)).toBe(str);
    });

    it('truncates strings over 300 characters', () => {
      const str = 'a'.repeat(350);
      expect(truncateString(str)).toBe(
        'a'.repeat(300) + '...(50 more characters)',
      );
    });

    it('handles single-line strings with special characters', () => {
      const str = 'hello world '.repeat(50); // Over 300 chars
      const result = truncateString(str);
      expect(result).toMatch(/\.\.\.\(\d+ more characters\)$/);
      expect(result.startsWith('hello world')).toBe(true);
    });
  });

  describe('multiline strings', () => {
    it('returns multiline strings with 5 or fewer lines unchanged', () => {
      const str = 'line1\nline2\nline3\nline4\nline5';
      expect(truncateString(str)).toBe(str);
    });

    it('truncates multiline strings with more than 5 lines', () => {
      const str = 'line1\nline2\nline3\nline4\nline5\nline6\nline7';
      const result = truncateString(str);
      expect(result).toBe(
        'line1\nline2\nline3\nline4\nline5\n...(2 more lines)',
      );
    });

    it('ignores trailing blank lines when determining line count', () => {
      const str = 'line1\nline2\nline3\n\n\n';
      expect(truncateString(str)).toBe('line1\nline2\nline3');
    });

    it('handles multiline string with exactly 6 lines', () => {
      const str = 'a\nb\nc\nd\ne\nf';
      const result = truncateString(str);
      expect(result).toBe('a\nb\nc\nd\ne\n...(1 more line)');
    });

    it('handles multiline strings with proper pluralization', () => {
      const str10Lines = Array.from({ length: 10 }, (_, i) => `line${i}`).join(
        '\n',
      );
      const result = truncateString(str10Lines);
      expect(result).toContain('(5 more lines)');
      expect(result).toContain('...');
    });

    it('handles multiline string with many lines', () => {
      const lines = Array.from({ length: 100 }, (_, i) => `line${i}`);
      const str = lines.join('\n');
      const result = truncateString(str);
      expect(result).toContain('(95 more lines)');
      const resultLines = result.split('\n');
      expect(resultLines.length).toBe(6); // 5 lines + suffix line with ellipsis
    });

    it('handles strings with mixed line lengths', () => {
      const str = 'short\nthis is a much longer line\nx\ny\nz\nline6\nline7';
      const result = truncateString(str);
      expect(result).toBe(
        'short\nthis is a much longer line\nx\ny\nz\n...(2 more lines)',
      );
    });
  });

  describe('edge cases', () => {
    it('handles empty strings', () => {
      expect(truncateString('')).toBe('');
    });

    it('handles strings with only whitespace', () => {
      expect(truncateString('   ')).toBe('   ');
    });

    it('handles strings with only newlines', () => {
      expect(truncateString('\n\n\n')).toBe('');
    });

    it('handles single newline', () => {
      expect(truncateString('\n')).toBe('');
    });

    it('handles newline at end of single line', () => {
      expect(truncateString('hello\n')).toBe('hello');
    });
  });
});

describe('truncateObject', () => {
  it('truncates string values in objects', () => {
    const obj = {
      shortStr: 'hello',
      longStr: 'a'.repeat(350),
    };
    const result = truncateObject(obj);
    expect(result['shortStr']).toBe('hello');
    expect(result['longStr']).toBe('a'.repeat(300) + '...(50 more characters)');
  });

  it('handles nested objects', () => {
    const obj = {
      nested: {
        longStr: 'b'.repeat(350),
      },
    };
    const result = truncateObject(obj);
    expect(result['nested']).toEqual({
      longStr: 'b'.repeat(300) + '...(50 more characters)',
    });
  });

  it('handles arrays of strings', () => {
    const obj = {
      items: ['short', 'a'.repeat(350)],
    };
    const result = truncateObject(obj);
    expect(result['items']).toEqual([
      'short',
      'a'.repeat(300) + '...(50 more characters)',
    ]);
  });

  it('handles arrays of objects', () => {
    const obj = {
      items: [{ text: 'a'.repeat(350) }, { text: 'short' }],
    };
    const result = truncateObject(obj);
    expect(Array.isArray(result['items'])).toBe(true);
    const items = result['items'] as unknown[];
    expect(items[0]).toEqual({
      text: 'a'.repeat(300) + '...(50 more characters)',
    });
    expect(items[1]).toEqual({ text: 'short' });
  });

  it('preserves non-string values', () => {
    const obj = {
      num: 42,
      bool: true,
      nil: null,
    };
    const result = truncateObject(obj);
    expect(result).toEqual(obj);
  });

  it('handles deeply nested structures', () => {
    const obj = {
      level1: {
        level2: {
          level3: {
            text: 'a'.repeat(350),
          },
        },
      },
    };
    const result = truncateObject(obj);
    const level3 = (
      (result['level1'] as Record<string, unknown>)['level2'] as Record<
        string,
        unknown
      >
    )['level3'] as Record<string, unknown>;
    expect(level3['text']).toBe('a'.repeat(300) + '...(50 more characters)');
  });

  it('handles multiline strings in objects', () => {
    const multilineStr = 'line1\nline2\nline3\nline4\nline5\nline6\nline7';
    const obj = {
      content: multilineStr,
    };
    const result = truncateObject(obj);
    expect(result['content']).toBe(
      'line1\nline2\nline3\nline4\nline5\n...(2 more lines)',
    );
  });

  it('handles mixed arrays with strings and objects', () => {
    const obj = {
      items: ['a'.repeat(350), { name: 'b'.repeat(350) }, 'short'],
    };
    const result = truncateObject(obj);
    const items = result['items'] as unknown[];
    expect(items[0]).toBe('a'.repeat(300) + '...(50 more characters)');
    expect((items[1] as Record<string, unknown>)['name']).toBe(
      'b'.repeat(300) + '...(50 more characters)',
    );
    expect(items[2]).toBe('short');
  });

  it('returns a new object without mutating the original', () => {
    const obj = {
      text: 'a'.repeat(350),
    };
    const originalText = obj.text;
    truncateObject(obj);
    expect(obj.text).toBe(originalText);
  });
});
