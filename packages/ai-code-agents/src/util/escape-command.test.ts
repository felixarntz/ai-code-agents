import { describe, it, expect } from 'vitest';
import { escapeCommand } from './escape-command';

describe('escapeCommand', () => {
  it('should wrap a simple command in double quotes', () => {
    expect(escapeCommand('ls -la')).toBe('"ls -la"');
  });

  it('should escape double quotes', () => {
    expect(escapeCommand('echo "hello world"')).toBe(
      '"echo \\"hello world\\""',
    );
  });

  it('should escape backslashes', () => {
    expect(escapeCommand('echo \\$HOME')).toBe('"echo \\\\$HOME"');
  });

  it('should escape both backslashes and double quotes', () => {
    expect(escapeCommand('echo "\\$HOME is \\"here\\""')).toBe(
      '"echo \\"\\\\$HOME is \\\\\\"here\\\\\\"\\""',
    );
  });

  it('should handle the example from the task', () => {
    expect(escapeCommand("cd 'dir/sub dir' && ls -la")).toBe(
      '"cd \'dir/sub dir\' && ls -la"',
    );
  });

  it('should handle empty string', () => {
    expect(escapeCommand('')).toBe('""');
  });

  it('should handle command with single quotes', () => {
    expect(escapeCommand("echo 'hello world'")).toBe('"echo \'hello world\'"');
  });

  it('should handle command with shell metacharacters', () => {
    expect(escapeCommand('echo $HOME && echo "done"')).toBe(
      '"echo $HOME && echo \\"done\\""',
    );
  });

  it('should handle command with backslashes and quotes', () => {
    expect(escapeCommand('echo \\"hello\\" && echo \\\\backslash')).toBe(
      '"echo \\\\\\"hello\\\\\\" && echo \\\\\\\\backslash"',
    );
  });
});
