import { describe, it, expect } from 'vitest';
import { escapeCommandArg } from './escape-command-arg';

describe('escapeCommandArg', () => {
  it('should return empty quotes for an empty string', () => {
    expect(escapeCommandArg('')).toBe("''");
  });

  it('should quote a simple string', () => {
    expect(escapeCommandArg('foo')).toBe("'foo'");
  });

  it('should quote a string with spaces', () => {
    expect(escapeCommandArg('foo bar')).toBe("'foo bar'");
  });

  it('should escape a single quote', () => {
    expect(escapeCommandArg("it's a test")).toBe("'it'\\''s a test'");
  });

  it('should escape multiple single quotes', () => {
    expect(escapeCommandArg("a'b'c")).toBe("'a'\\''b'\\''c'");
  });

  it('should quote a string with a leading dash', () => {
    expect(escapeCommandArg('-v')).toBe("'-v'");
  });

  it('should quote a string containing shell metacharacters', () => {
    const metachars = '`~!@#$%^&*()_+-=[]{}|;:",.<>/?';
    expect(escapeCommandArg(metachars)).toBe(`'${metachars}'`);
  });

  it('should quote a string containing a backslash', () => {
    expect(escapeCommandArg('foo\\bar')).toBe("'foo\\bar'");
  });
});
