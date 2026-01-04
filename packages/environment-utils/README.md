# @ai-code-agents/environment-utils

Utilities for implementing AI Code agents execution environments.

This package provides the foundational interfaces, base classes, and utility functions used to build custom environments and tools for the [ai-code-agents](https://www.npmjs.com/package/ai-code-agents) SDK.

## Installation

```bash
npm install @ai-code-agents/environment-utils
```

## Core Concepts

### Environment Interfaces

The package defines several key interfaces that all environments should implement:

- `FilesystemEnvironmentInterface`: Basic file operations (read, write, delete, move, copy).
- `CommandLineEnvironmentInterface`: Extends filesystem operations with command execution.
- `ShutdownableEnvironmentInterface`: For environments that require explicit cleanup (e.g., closing connections or stopping containers).

### Base Classes

To simplify implementation, several abstract base classes are provided:

- `FilesystemEnvironmentBase`: Implements the `FilesystemEnvironmentInterface` logic, requiring only low-level file access methods to be implemented.
- `CommandLineEnvironmentBase`: Extends `FilesystemEnvironmentBase` with a base for command execution.
- `UnixEnvironmentBase`: A specialized base class for Unix-like environments that implements filesystem operations using standard Unix commands (`cat`, `rm`, `mv`, etc.) via `runCommand`.
- `ToolBase`: A base class for creating tools compatible with the Vercel AI SDK.
- `EnvironmentToolBase`: A specialized base class for tools that operate within a specific execution environment.

### Utilities

- `escapeCommandArg(arg)`: Safely escapes a string for use as a command-line argument.
- `validateRelativePath(path)`: Ensures a path is relative and does not attempt to escape the project directory (preventing directory traversal).

## Usage Example: Custom Environment

```typescript
import {
  UnixEnvironmentBase,
  type RunCommandResult,
} from '@ai-code-agents/environment-utils';

class MyCustomEnvironment extends UnixEnvironmentBase<{ myConfig: string }> {
  get name() {
    return 'my-custom-env';
  }

  protected async executeCommand(
    command: string,
  ): Promise<[number, string, string]> {
    // Implement your custom command execution logic here
    // Returns [exitCode, stdout, stderr]
    return [0, 'output', ''];
  }
}
```

## Contributing

Contributions to the AI Code Agents SDK are welcome and highly appreciated. Please review the [contributing guidelines](https://github.com/felixarntz/ai-code-agents/blob/main/CONTRIBUTING.md) to learn more about how you can contribute.
