import { describe, it, expect } from 'vitest';
import { Bash } from 'just-bash';
import {
  JustBashEnvironment,
  JustBashEnvironmentName,
} from './just-bash-environment';

/**
 * Creates a default test environment for JustBashEnvironment tests.
 *
 * @returns A new JustBashEnvironment instance with default configuration.
 */
function createDefaultTestEnvironment(): JustBashEnvironment {
  return JustBashEnvironment.create();
}

describe('JustBashEnvironment', () => {
  describe('name', () => {
    it('should return the correct environment name', () => {
      const env = createDefaultTestEnvironment();
      expect(env.name).toBe(JustBashEnvironmentName);
      expect(env.name).toBe('just-bash');
    });
  });

  describe('create factory method', () => {
    it('should create an environment with default configuration', () => {
      const env = JustBashEnvironment.create();
      expect(env.name).toBe('just-bash');
    });

    it('should create an environment with empty options object', () => {
      const env = JustBashEnvironment.create({});
      expect(env.name).toBe('just-bash');
    });

    it('should create an environment with initial files via bashOptions', () => {
      const files = {
        '/test.txt': 'Hello, World!',
        '/data/config.json': '{"key": "value"}',
      };
      const env = JustBashEnvironment.create({ bashOptions: { files } });
      expect(env.name).toBe('just-bash');
    });

    it('should create an environment with custom directory path', () => {
      const env = JustBashEnvironment.create({ directoryPath: '/app' });
      expect(env.name).toBe('just-bash');
    });

    it('should create an environment with custom environment variables', () => {
      const env = JustBashEnvironment.create({
        env: { MY_VAR: 'my_value', ANOTHER_VAR: '123' },
      });
      expect(env.name).toBe('just-bash');
    });

    it('should create an environment with all config options', () => {
      const files = { '/test.txt': 'content' };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/app',
        env: { MY_VAR: 'value' },
      });
      expect(env.name).toBe('just-bash');
    });
  });

  describe('constructor with existing Bash instance', () => {
    it('should create an environment with an existing Bash instance', () => {
      const bash = new Bash({ files: { '/test.txt': 'content' } });
      const env = new JustBashEnvironment({ bash });
      expect(env.name).toBe('just-bash');
    });

    it('should create an environment with Bash instance and directoryPath', () => {
      const bash = new Bash({ cwd: '/app' });
      const env = new JustBashEnvironment({ bash, directoryPath: '/app' });
      expect(env.name).toBe('just-bash');
    });
  });

  describe('runCommand', () => {
    it('should execute a simple echo command', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout, stderr } = await env.runCommand('echo "Hello"');

      expect(exitCode).toBe(0);
      expect(stdout).toBe('Hello\n');
      expect(stderr).toBe('');
    });

    it('should execute a command and return non-zero exit code on failure', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode } = await env.runCommand('exit 42');

      expect(exitCode).toBe(42);
    });

    it('should capture stderr output', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stderr } = await env.runCommand('echo "error" >&2');

      expect(exitCode).toBe(0);
      expect(stderr).toBe('error\n');
    });

    it('should handle command with pipes', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'echo "hello world" | tr "h" "H"',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('Hello world\n');
    });

    it('should handle command chaining with &&', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'echo "first" && echo "second"',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('first\nsecond\n');
    });

    it('should handle command chaining with ||', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'false || echo "fallback"',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('fallback\n');
    });

    it('should handle variable expansion', async () => {
      const env = JustBashEnvironment.create({ env: { MY_VAR: 'test_value' } });
      const { exitCode, stdout } = await env.runCommand('echo $MY_VAR');

      expect(exitCode).toBe(0);
      expect(stdout).toBe('test_value\n');
    });

    it('should handle arithmetic expressions', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand('echo $((2 + 3))');

      expect(exitCode).toBe(0);
      expect(stdout).toBe('5\n');
    });
  });

  describe('file operations via inherited methods', () => {
    it('should read a file that was initialized', async () => {
      const files = { '/home/user/test.txt': 'file content' };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/home/user',
      });

      const result = await env.readFile('test.txt');
      expect(result.content).toBe('file content');
    });

    it('should write and read a file', async () => {
      const env = JustBashEnvironment.create({ directoryPath: '/home/user' });

      await env.writeFile('newfile.txt', 'new content');
      const result = await env.readFile('newfile.txt');
      // Note: The underlying writeFileContent uses echo which adds a newline.
      expect(result.content).toBe('new content\n');
    });

    it('should throw error when reading non-existent file', async () => {
      const files = { '/home/user/exists.txt': 'content' };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/home/user',
      });

      const result = await env.readFile('exists.txt');
      expect(result.content).toBe('content');

      await expect(env.readFile('nonexistent.txt')).rejects.toThrow(
        'File not found: nonexistent.txt',
      );
    });

    it('should delete a file', async () => {
      const files = { '/home/user/todelete.txt': 'content' };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/home/user',
      });

      const result = await env.readFile('todelete.txt');
      expect(result.content).toBe('content');

      await env.deleteFile('todelete.txt');

      await expect(env.readFile('todelete.txt')).rejects.toThrow(
        'File not found: todelete.txt',
      );
    });

    it('should move a file', async () => {
      const files = {
        '/home/user/source.txt': 'source content',
      };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/home/user',
      });

      await env.moveFile('source.txt', 'destination.txt');

      await expect(env.readFile('source.txt')).rejects.toThrow(
        'File not found: source.txt',
      );
      const result = await env.readFile('destination.txt');
      expect(result.content).toBe('source content');
    });

    it('should copy a file', async () => {
      const files = {
        '/home/user/original.txt': 'original content',
      };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/home/user',
      });

      await env.copyFile('original.txt', 'copy.txt');

      const originalResult = await env.readFile('original.txt');
      expect(originalResult.content).toBe('original content');
      const copyResult = await env.readFile('copy.txt');
      expect(copyResult.content).toBe('original content');
    });
  });

  describe('directory operations', () => {
    it('should work with custom cwd', async () => {
      const files = { '/app/data.txt': 'app data' };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/app',
      });

      const { exitCode, stdout } = await env.runCommand('pwd');
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe('/app');
    });

    it('should use default cwd when not specified', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand('pwd');

      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe('/home/user');
    });

    it('should create directories with mkdir -p', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode } = await env.runCommand(
        'mkdir -p /home/user/nested/path',
      );

      expect(exitCode).toBe(0);

      const { stdout: lsOutput } = await env.runCommand('ls /home/user/nested');
      expect(lsOutput.trim()).toBe('path');
    });
  });

  describe('edge cases', () => {
    it('should handle empty command', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout, stderr } = await env.runCommand('');

      expect(exitCode).toBe(0);
      expect(stdout).toBe('');
      expect(stderr).toBe('');
    });

    it('should handle whitespace-only command', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout, stderr } = await env.runCommand('   ');

      expect(exitCode).toBe(0);
      expect(stdout).toBe('');
      expect(stderr).toBe('');
    });

    it('should handle special characters in output', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'echo "special: $PWD & <tag> \\"quoted\\""',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('special:');
    });

    it('should handle very long output', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand('seq 1 100');

      expect(exitCode).toBe(0);
      const lines = stdout.trim().split('\n');
      expect(lines.length).toBe(100);
      expect(lines[0]).toBe('1');
      expect(lines[99]).toBe('100');
    });

    it('should handle commands that produce both stdout and stderr', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout, stderr } = await env.runCommand(
        'echo "out" && echo "err" >&2',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('out\n');
      expect(stderr).toBe('err\n');
    });

    it('should handle syntax errors gracefully', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stderr } = await env.runCommand('echo ${');

      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('syntax error');
    });
  });

  describe('shell features', () => {
    it('should support if statements', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'if true; then echo "yes"; else echo "no"; fi',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('yes\n');
    });

    it('should support for loops', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'for i in 1 2 3; do echo $i; done',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('1\n2\n3\n');
    });

    it('should support while loops', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'i=0; while [ $i -lt 3 ]; do echo $i; i=$((i+1)); done',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('0\n1\n2\n');
    });

    it('should support functions', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'greet() { echo "Hello, $1!"; }; greet "World"',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('Hello, World!\n');
    });

    it('should support command substitution', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'echo "Today is $(date +%Y)"',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toMatch(/Today is \d{4}/);
    });

    it('should support glob patterns', async () => {
      const files = {
        '/home/user/file1.txt': 'content1',
        '/home/user/file2.txt': 'content2',
        '/home/user/other.md': 'markdown',
      };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/home/user',
      });

      const { exitCode, stdout } = await env.runCommand('ls *.txt | sort');

      expect(exitCode).toBe(0);
      expect(stdout).toContain('file1.txt');
      expect(stdout).toContain('file2.txt');
      expect(stdout).not.toContain('other.md');
    });
  });

  describe('built-in commands', () => {
    it('should support cat command', async () => {
      const files = { '/home/user/test.txt': 'test content' };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/home/user',
      });

      const { exitCode, stdout } = await env.runCommand('cat test.txt');

      expect(exitCode).toBe(0);
      expect(stdout).toBe('test content');
    });

    it('should support grep command', async () => {
      const files = {
        '/home/user/data.txt': 'line1\nline2 match\nline3',
      };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/home/user',
      });

      const { exitCode, stdout } = await env.runCommand('grep match data.txt');

      expect(exitCode).toBe(0);
      expect(stdout).toBe('line2 match\n');
    });

    it('should support head command', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand('seq 1 10 | head -3');

      expect(exitCode).toBe(0);
      expect(stdout).toBe('1\n2\n3\n');
    });

    it('should support tail command', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand('seq 1 10 | tail -3');

      expect(exitCode).toBe(0);
      expect(stdout).toBe('8\n9\n10\n');
    });

    it('should support wc command', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'echo -e "line1\\nline2\\nline3" | wc -l',
      );

      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe('3');
    });

    it('should support sort command', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'echo -e "banana\\napple\\ncherry" | sort',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('apple\nbanana\ncherry\n');
    });

    it('should support uniq command', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'echo -e "a\\na\\nb\\nb\\nb\\nc" | uniq',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('a\nb\nc\n');
    });

    it('should support cut command', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'echo "a,b,c" | cut -d, -f2',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('b\n');
    });

    it('should support sed command', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        'echo "hello world" | sed "s/world/universe/"',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('hello universe\n');
    });

    it('should support awk command', async () => {
      const env = createDefaultTestEnvironment();
      const { exitCode, stdout } = await env.runCommand(
        "echo '1 2 3' | awk '{print $2}'",
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('2\n');
    });

    it('should support find command', async () => {
      const files = {
        '/home/user/dir/file1.txt': 'content1',
        '/home/user/dir/file2.txt': 'content2',
      };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/home/user',
      });

      const { exitCode, stdout } = await env.runCommand(
        'find dir -name "*.txt" | sort',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('file1.txt');
      expect(stdout).toContain('file2.txt');
    });

    it('should support jq command for JSON processing', async () => {
      const files = {
        '/home/user/data.json': '{"name": "test", "value": 42}',
      };
      const env = JustBashEnvironment.create({
        bashOptions: { files },
        directoryPath: '/home/user',
      });

      const { exitCode, stdout } = await env.runCommand(
        'cat data.json | jq .name',
      );

      expect(exitCode).toBe(0);
      expect(stdout).toBe('"test"\n');
    });
  });

  describe('environment isolation', () => {
    it('should isolate environment variables between exec calls', async () => {
      const env = createDefaultTestEnvironment();

      await env.runCommand('export TEST_VAR=value1');
      const { stdout } = await env.runCommand('echo $TEST_VAR');

      // Each exec is isolated, so TEST_VAR should not persist.
      expect(stdout.trim()).toBe('');
    });

    it('should persist filesystem changes between exec calls', async () => {
      const env = JustBashEnvironment.create({ directoryPath: '/home/user' });

      await env.runCommand('echo "test" > persistent.txt');
      const { stdout } = await env.runCommand('cat persistent.txt');

      expect(stdout).toBe('test\n');
    });

    it('should not persist cwd changes between exec calls', async () => {
      const env = JustBashEnvironment.create({ directoryPath: '/home/user' });

      await env.runCommand('cd /tmp');
      const { stdout } = await env.runCommand('pwd');

      // cwd should reset to initial value.
      expect(stdout.trim()).toBe('/home/user');
    });
  });
});
