# AI Code Agents - Coding Agent Guide

## Project Overview

AI Code Agents is a TypeScript SDK for creating AI agents that can interact with sandboxed code execution environments. The library provides a flexible framework for building agents that can read, write, and manipulate files, execute commands, and perform various filesystem operations within controlled environments such as Docker containers, local filesystems, or mock environments. Built on top of the Vercel AI SDK, it enables developers to create powerful agentic AI systems with step-by-step execution tracking and comprehensive tool support.

A core design principle is **environment abstraction**: all tools are built against environment interfaces, making them fully interoperable across different concrete environment implementations. Combined with the Vercel AI SDK's model-agnostic approach that supports virtually any AI provider, this architecture ensures **no vendor lock-in** - you can freely switch between different execution environments (local, Docker, cloud) and AI models (OpenAI, Anthropic, Google, etc.) without rewriting your agent logic.

## Commands & Scripts

**Build:**

- `pnpm build` - Build all packages in the monorepo

**Linting & Formatting:**

- `pnpm lint` - Run ESLint on all files
- `pnpm lint:fix` - Run ESLint and automatically fix issues
- `pnpm format` - Format all files with Prettier

**Testing:**

- `pnpm test` - Run tests in all packages
- `pnpm --filter ai-code-agents test` - Run tests only for the `ai-code-agents` package
- `pnpm --filter cli test` - Run tests only for the `cli` package
- `pnpm typecheck` - Run TypeScript type checking in all packages

**Development:**

- `pnpm ai-code-agents` - Run the CLI tool in debug mode

## Coding Standards & Compatibility Constraints

**Node.js Version:**

- Minimum required: Node.js >=20.0.0

**Module System:**

- ESM (ES Modules) only - no CommonJS
- Use `import`/`export` syntax exclusively
- Omit the file extension for local imports (e.g. `from './file'` instead of `from './file.js'`)
- Never use `require()`

**TypeScript Configuration:**

- Strict mode enabled with all strict checks
- No implicit any, returns, or this
- Force consistent casing in filenames
- Verbatim module syntax required

**Code Style (Prettier):**

- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in all multi-line structures
- 80 character line width

**Linting Rules:**

- No explicit `any` types allowed
- Type imports must use `type` keyword
- `const` preferred over `let` (destructuring must use `const` for all)
- No `var` declarations
- Object shorthand syntax required
- Import order must be maintained

**Documentation Requirements:**

- TSDoc comments required for all:
  - Classes
  - Public methods
  - Functions (except arrow functions)
- Must include description, parameter docs, and return value docs
- Parameter descriptions must be separated from names with a dash (-)
- Use `@returns` (not `@return`)
- Start function/method descriptions with third-person verbs
- All documentation must end with a period

## Core Principles

### Type Safety First

All code must maintain strict TypeScript type safety. Never use `any` types - use proper generics, union types, or unknown when necessary. All public APIs must have explicit type definitions.

### Immutability & Functional Patterns

Prefer immutable data structures and functional programming patterns. Use `const` by default, avoid mutations, and favor pure functions where possible.

### Comprehensive Testing

All functionality must be covered by unit tests using Vitest. Tests should be co-located with source files using the `.test.ts` suffix.

### Environment Abstraction

All environment interactions (filesystem, command execution) must go through the environment interface abstractions. Never access the filesystem or execute commands directly - always use the provided environment interfaces.

### Tool-Based Architecture

Functionality should be exposed as tools that implement the `ToolInterface`, more specifically via the `EnvironmentToolInterface`. Each tool should have a single, well-defined responsibility and comprehensive input/output schemas using Zod.

### Security & Sandboxing

All code execution and filesystem operations must respect environment boundaries. The `UnsafeLocalEnvironment` should only be used in development/testing contexts with explicit user awareness.

## Project Architecture Overview

The project is organized as a pnpm monorepo with the following packages:

### Core Package (`packages/ai-code-agents`)

The main SDK library that provides:

**Environments:**

- `createEnvironment<T extends EnvironmentName>()`: Factory function for creating an environment.
- Examples of environments available: `DockerEnvironment`, `MockFilesystemEnvironment`, `UnsafeLocalEnvironment`
- See `packages/ai-code-agents/src/environments` for the full list of environments available.

**Tools:**

- `createEnvironmentTool<T extends EnvironmentToolName>()`: Factory function for creating an environment tool.
- `createToolsForEnvironment()`: Bulk factory function for creating a set of multiple environment tools.
- Examples of environment tools available: `ReadFileTool`, `WriteFileTool`, `ListDirectoryTool`, `RunCommandTool`
- See `packages/ai-code-agents/src/tools` for the full list of tools available.

**Agents:**

- `createCodeAgent()`: Factory function for creating a coding agent operating with tools on one or more environments.
- Support for single or multiple environments, with configurable tool sets per environment

### CLI Package (`packages/cli`)

Command-line interface for running code agents with various commands and configurations.

### Environment Utils Package (`packages/environment-utils`)

Utilities for implementing AI Code agents execution environments.

### Just Bash Package (`packages/just-bash`)

Execution environment for coding agents using the "just-bash" simulated bash environment.

### Vercel Sandbox Package (`packages/vercel-sandbox`)

Execution environment for coding agents using Vercel Sandbox.

## Directory Structure

This is an overview of the most important files and directories in the project. It is not comprehensive - there may be additional files and directories not listed here.

```
/
├── packages/
│   ├── ai-code-agents/          # Core SDK library
│   │   ├── src/
│   │   │   ├── environments/    # Environment implementations
│   │   │   ├── tools/           # Tool implementations
│   │   │   ├── util/            # Utility functions
│   │   │   ├── agent-creators.ts
│   │   │   ├── environment-creators.ts
│   │   │   ├── tool-creators.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── package.json         # Package configuration
│   │   ├── tsconfig.json        # TypeScript configuration
│   │   ├── tsup.config.ts       # Build configuration
│   │   └── vitest.config.ts     # Test configuration
│   ├── cli/                     # CLI application
│   │   ├── src/
│   │   │   ├── commands/        # CLI command implementations
│   │   │   └── cli.ts
│   │   ├── package.json         # Package configuration
│   │   ├── tsconfig.json        # TypeScript configuration
│   │   ├── tsup.config.ts       # Build configuration
│   │   └── vitest.config.ts     # Test configuration
│   ├── environment-utils/       # Environment utilities
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json         # Package configuration
│   │   ├── tsconfig.json        # TypeScript configuration
│   │   ├── tsup.config.ts       # Build configuration
│   │   └── vitest.config.ts     # Test configuration
│   └── just-bash/               # Just Bash environment
│       ├── src/
│       │   └── index.ts
│       ├── package.json         # Package configuration
│       ├── tsconfig.json        # TypeScript configuration
│       ├── tsup.config.ts       # Build configuration
│       └── vitest.config.ts     # Test configuration
├── .clinerules/                 # Cline AI assistant rules
├── eslint.config.js             # ESLint configuration
├── tsconfig.json                # Root TypeScript config
├── pnpm-workspace.yaml          # pnpm workspace definition
└── package.json                 # Root package configuration
```

## Git Repo

The main branch for this project is called **main**.

## Agent Guidelines

**DO:**

- Use the environment interfaces for all filesystem and command operations
- Implement comprehensive Zod schemas for all tool inputs and outputs
- Write TSDoc comments for all public APIs
- Use type imports with the `type` keyword
- Prefer arrow functions and functional patterns
- Test all functionality with Vitest
- Use `const` for all variable declarations unless mutation is required
- Follow the existing tool patterns when creating new tools
- Validate all file paths to prevent directory traversal attacks
- Use the `EnvironmentToolBase` class when creating environment-dependent tools

**DON'T:**

- Access the filesystem or execute commands directly - always use environment interfaces
- Use `any` types - use proper type definitions or `unknown`
- Use `require()` - only use ES6 `import`/`export`
- Create tools without proper input/output schemas
- Skip documentation for public APIs
- Use `var` for variable declarations
- Mutate objects or arrays in place without good reason
- Create tools that perform multiple unrelated operations
- Expose the `UnsafeLocalEnvironment` in production code
- Forget to add examples to tool definitions

## Common Pitfalls

**Path Validation:**
Always validate relative paths using the `validateRelativePath()` utility to prevent directory traversal attacks. Never trust user-provided paths without validation.

**Environment Boundaries:**
Remember that different environments have different capabilities. Not all environments support command execution - check if the environment implements `CommandLineEnvironmentInterface` before attempting to run commands.

**Tool Name Conflicts:**
When creating agents with multiple environments or custom tools, ensure tool names don't conflict. The `createCodeAgent()` function will throw an error if duplicate tool names are detected.

**Async Operations:**
All tool executions and environment operations are asynchronous. Always use `await` and handle promises properly. Don't forget to handle errors appropriately.

**Type Imports:**
Use `import type` for type-only imports to ensure proper tree-shaking and avoid runtime imports of types. The linter will enforce this.

**Documentation Format:**
TSDoc comments must follow specific formatting rules. Parameter descriptions must be separated from parameter names with a dash, and all docs must end with periods. Use `@returns` not `@return`.

**Testing with Mock Environments:**
When testing tools, use `MockFilesystemEnvironment` rather than real filesystem operations. This ensures tests are fast, isolated, and don't have side effects.

**Command Escaping:**
When building commands for execution, use the `escapeCommandArg()` utility to properly escape arguments and prevent command injection vulnerabilities.

**Step Limits:**
Agents have a maximum step count. Design your agent workflows to complete within reasonable step limits, and use the `allowSubmit` option to let agents signal completion early.
