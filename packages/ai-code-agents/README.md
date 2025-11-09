# AI Code Agents

A TypeScript SDK for creating AI agents that interact with sandboxed code execution environments. Built on the [Vercel AI SDK](https://ai-sdk.dev/), it provides a flexible, type-safe framework for building AI coding agents—for vibe coding, coding assistance, or multi-agentic workflows—with comprehensive tool support and environment abstraction.

## Key Features

- **🔓 No Vendor Lock-in**: Environment abstraction layer works across any execution environment (local, Docker, cloud sandboxes). Model-agnostic architecture supports any AI provider through the Vercel AI SDK.
- **🛡️ Type-Safe**: Full TypeScript support with strict typing and comprehensive Zod schemas for all tool inputs/outputs.
- **🔧 Flexible Tool System**: Several built-in tools with configurable safety levels (`readonly`, `basic`, `all`). Easy to extend with custom tools.
- **🌍 Environment Abstraction**: Write tools once, run anywhere. All tools work seamlessly across different environment implementations.
- **📦 Multiple Environments**: Support for single or multiple environments per agent, enabling complex multi-context workflows.
- **🎯 Step-by-Step Execution**: Built-in step tracking and logging for transparent agent behavior.

## Installation

You will need:

- Node.js 20+
- `npm` or another package manager
- AI SDK v5+ and zod v4+ (see below)

```bash
npm install ai-code-agents ai zod
```

## Quick Start

```typescript
import { openai } from '@ai-sdk/openai';
import { createCodeAgent, createEnvironment } from 'ai-code-agents';

// Create a Docker environment (requires a running container)
const environment = createEnvironment('docker', {
  containerId: 'my-container-id',
  directoryPath: '/workspace',
});

// Create an agent with all tools
const agent = createCodeAgent({
  model: openai('gpt-4'),
  environment,
  environmentToolsDefinition: 'all',
  maxSteps: 10,
  logStep: (log: string) => console.log(log),
});

// Run the agent
const result = await agent.generate({
  prompt: 'Create a simple Node.js HTTP server in server.js',
});

console.log(result.text);
```

## Core Concepts

### Environments

Environments provide sandboxed execution contexts for agents. All tools are built against environment interfaces, ensuring complete interoperability.

**Currently Available:**

- `docker` - Docker container environments
- `node-filesystem` - Node.js filesystem operations (read-only recommended)
- `unsafe-local` - Local filesystem with command execution (development only)
- `mock-filesystem` - In-memory filesystem for testing

**Planned:**

- `e2b` - E2B cloud sandboxes
- `vercel-sandbox` - Vercel sandbox environments

### Tools

Tools enable agents to interact with their environments. Each tool has a well-defined purpose with comprehensive input/output validation.

**Currently Available:**

- `read_file` - Read file contents
- `write_file` - Write or create files
- `delete_file` - Delete files
- `edit_file` - Edit files with search/replace operations
- `move_file` - Move or rename files
- `copy_file` - Copy files
- `read_many_files` - Batch read multiple files
- `get_project_file_structure` - Get complete project tree structure
- `glob` - Pattern-based file search
- `list_directory` - List directory contents
- `run_command` - Execute shell commands

**Planned:**

- `run_npm_script` - Execute npm/pnpm/yarn scripts from package.json
- `run_composer_script` - Execute Composer scripts from composer.json
- `run_make_target` - Execute Makefile targets

**Safety Levels:**

- `readonly` - Only read operations (safe for production)
- `basic` - Read and write operations, no deletions or commands
- `all` - Full access including deletions and command execution

### Agent Integrations

**Currently Available:**

- [Vercel AI SDK](https://ai-sdk.dev/) - Integration with AI SDK agents

**Planned:**

- [Mastra](https://mastra.ai/) - Integration with Mastra agents
- [AI SDK Tools](https://ai-sdk-tools.dev/) - Integration with AI SDK Tools agents

## Usage Examples

### Single Environment Agent

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { createCodeAgent, createEnvironment } from 'ai-code-agents';

const environment = createEnvironment('unsafe-local', {
  directoryPath: '/path/to/project',
});

const agent = createCodeAgent({
  model: anthropic('claude-sonnet-4.5'),
  environment,
  environmentToolsDefinition: 'basic', // Read/write only, no deletions
  maxSteps: 15,
  logStep: (log, index) => {
    console.log(`Step ${index + 1}:\n${log}\n`);
  },
});

const result = await agent.generate({
  prompt: 'Create a Python script that calculates fibonacci numbers',
});
```

### Multi-Environment Agent

```typescript
import { openai } from '@ai-sdk/openai';
import { createCodeAgent, createEnvironment } from 'ai-code-agents';

// Create multiple environments (requires running containers)
const environments = {
  frontend: createEnvironment('docker', {
    containerId: 'frontend-container-id',
    directoryPath: '/app',
  }),
  backend: createEnvironment('docker', {
    containerId: 'backend-container-id',
    directoryPath: '/app',
  }),
};

// Configure tools per environment
const agent = createCodeAgent({
  model: openai('gpt-4'),
  environments,
  environmentToolsDefinition: {
    frontend: 'all',
    backend: 'basic',
  },
  maxSteps: 20,
});

const result = await agent.generate({
  prompt: 'Create a React frontend and Flask backend for a todo app',
});
```

### Custom Tool Configuration

```typescript
import { createCodeAgent, createEnvironment } from 'ai-code-agents';
import { google } from '@ai-sdk/google';

const environment = createEnvironment('node-filesystem', {
  directoryPath: '/path/to/project',
});

const agent = createCodeAgent({
  model: google('gemini-2.5-pro'),
  environment,
  environmentToolsDefinition: [
    'read_file',
    'read_many_files',
    'get_project_file_structure',
    {
      toolName: 'write_file',
      toolConfig: {
        needsApproval: true, // Require approval before writing
      },
    },
  ],
  maxSteps: 10,
});
```

### With Submit Tool

Enable agents to signal completion before reaching max steps:

```typescript
const agent = createCodeAgent({
  model: openai('gpt-4'),
  environment,
  environmentToolsDefinition: 'all',
  maxSteps: 20,
  allowSubmit: true, // Agent can call submit() to finish early
});
```

### Step Logging

Track agent execution with detailed step logs:

```typescript
const agent = createCodeAgent({
  model: anthropic('claude-sonnet-4.5'),
  environment,
  environmentToolsDefinition: 'all',
  maxSteps: 15,
  logStep: (stepLog) => {
    // stepLog contains formatted information about the step
    console.log(stepLog);
  },
});
```

## Contributing

Contributions to the AI Code Agents SDK are welcome and highly appreciated. Please review the [contributing guidelines](https://github.com/felixarntz/ai-code-agents/blob/main/CONTRIBUTING.md) to learn more about how you can contribute.
