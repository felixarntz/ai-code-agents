# @ai-code-agents/just-bash

Execution environment for coding agents using the "just-bash" simulated bash environment.

This package integrates with the [ai-code-agents](https://www.npmjs.com/package/ai-code-agents) SDK to provide a simulated bash execution environment. It uses the [just-bash](https://www.npmjs.com/package/just-bash) library to provide an in-memory virtual filesystem and bash shell for isolated code execution without requiring external processes or containers.

## Installation

```bash
npm install @ai-code-agents/just-bash ai-code-agents ai zod
```

## Quick Start

Create an AI coding agent with a Just Bash environment:

```typescript
import { openai } from '@ai-sdk/openai';
import { createCodeAgent } from 'ai-code-agents';
import { JustBashEnvironment } from '@ai-code-agents/just-bash';

// Create a Just Bash environment.
const environment = JustBashEnvironment.create({
  bashOptions: {
    files: {
      '/app/hello.sh': 'echo "Hello, World!"',
    },
  },
  directoryPath: '/app',
});

// Create an agent with all tools.
const agent = createCodeAgent({
  model: openai('gpt-5'),
  environment,
  environmentToolsDefinition: 'all',
  maxSteps: 10,
  logStep: (log) => console.log(log),
});

// Run the agent.
const result = await agent.generate({
  prompt: 'Create a simple script in hello.sh that prints "Hello, World!"',
});

console.log(result.text);
```

## Advanced Usage

### Using an Existing Bash Instance

If you want to manage the `Bash` instance yourself:

```typescript
import { Bash } from 'just-bash';
import { JustBashEnvironment } from '@ai-code-agents/just-bash';

// Create Bash instance externally.
const bash = new Bash({ files: { '/app/data.txt': 'hello' } });

// Pass it to the environment.
const environment = new JustBashEnvironment({
  bash,
  directoryPath: '/app',
});

// Use the environment with createCodeAgent()...
```

### Direct Environment Usage

Use the environment directly without an agent:

```typescript
import { JustBashEnvironment } from '@ai-code-agents/just-bash';

const env = JustBashEnvironment.create({
  directoryPath: '/app',
  env: { NODE_ENV: 'development' },
});

// Run commands.
const result = await env.runCommand('echo "Hello!"');
console.log(result.stdout);

// Read/write files.
await env.writeFile('hello.txt', 'Hello from Just Bash!');
const content = await env.readFile('hello.txt');
console.log(content);
```

## Configuration

### Constructor Config (`JustBashEnvironmentConfig`)

Use this when you have an existing `Bash` instance:

| Option          | Type                     | Description                                         |
| --------------- | ------------------------ | --------------------------------------------------- |
| `bash`          | `Bash`                   | **Required.** An existing `Bash` instance to use.   |
| `directoryPath` | `string`                 | Working directory path within the environment.      |
| `env`           | `Record<string, string>` | Environment variables to set when running commands. |

### Factory Options (`JustBashEnvironmentCreateFactoryOptions`)

Use this with `JustBashEnvironment.create()`:

| Option          | Type                     | Description                                                   |
| --------------- | ------------------------ | ------------------------------------------------------------- |
| `bashOptions`   | `BashOptions`            | Options for creating a new `Bash` instance. Defaults to `{}`. |
| `directoryPath` | `string`                 | Working directory path within the environment.                |
| `env`           | `Record<string, string>` | Environment variables to set when running commands.           |

## Contributing

Contributions to the AI Code Agents SDK are welcome and highly appreciated. Please review the [contributing guidelines](https://github.com/felixarntz/ai-code-agents/blob/main/CONTRIBUTING.md) to learn more about how you can contribute.
