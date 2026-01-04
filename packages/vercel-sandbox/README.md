# @ai-code-agents/vercel-sandbox

Execution environment for AI coding agents using [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox).

This package integrates with the [ai-code-agents](https://www.npmjs.com/package/ai-code-agents) SDK to provide isolated code execution in ephemeral Linux VMs powered by Firecracker MicroVMs.

## Installation

```bash
npm install @ai-code-agents/vercel-sandbox ai-code-agents ai zod
```

## Quick Start

Create an AI coding agent with a Vercel Sandbox environment:

```typescript
import { openai } from '@ai-sdk/openai';
import { createCodeAgent } from 'ai-code-agents';
import { VercelSandboxEnvironment } from '@ai-code-agents/vercel-sandbox';

// Create a Vercel Sandbox environment.
const environment = await VercelSandboxEnvironment.create({
  createOptions: { runtime: 'node22' },
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
  prompt: 'Create a simple Express server in server.js',
});

console.log(result.text);

// Stop the sandbox when done.
await environment.shutdown();
```

For more information on how to authenticate with Vercel Sandbox, consult [its documentation](https://vercel.com/docs/vercel-sandbox).

## Advanced Usage

### Using an Existing Sandbox Instance

If you want to manage the sandbox lifecycle yourself:

```typescript
import { Sandbox } from '@vercel/sandbox';
import { VercelSandboxEnvironment } from '@ai-code-agents/vercel-sandbox';

// Create sandbox externally.
const sandbox = await Sandbox.create({ runtime: 'node22' });

// Pass it to the environment.
const environment = new VercelSandboxEnvironment({
  sandbox,
  directoryPath: '/app',
});

// Use the environment with createCodeAgent()...

// Stop the sandbox when done.
await environment.shutdown();
```

### Direct Environment Usage

Use the environment directly without an agent:

```typescript
import { VercelSandboxEnvironment } from '@ai-code-agents/vercel-sandbox';

const env = await VercelSandboxEnvironment.create({
  createOptions: { runtime: 'node22' },
  directoryPath: '/app',
  env: { NODE_ENV: 'development' },
});

// Run commands.
const result = await env.runCommand('node --version');
console.log(result.stdout);

// Read/write files.
await env.writeFile('hello.js', 'console.log("Hello!");');
const content = await env.readFile('hello.js');
console.log(content);

// Stop the sandbox when done.
await env.shutdown();
```

## Configuration

### Constructor Config (`VercelSandboxEnvironmentConfig`)

Use this when you have an existing sandbox instance:

| Option          | Type                     | Description                                                               |
| --------------- | ------------------------ | ------------------------------------------------------------------------- |
| `sandbox`       | `Sandbox`                | **Required.** An existing Vercel Sandbox instance to use.                 |
| `directoryPath` | `string`                 | Working directory path within the sandbox. Defaults to `/vercel/sandbox`. |
| `env`           | `Record<string, string>` | Environment variables to set when running commands.                       |

### Factory Options (`VercelSandboxEnvironmentCreateFactoryOptions`)

Use this with `VercelSandboxEnvironment.create()`:

| Option          | Type                     | Description                                                               |
| --------------- | ------------------------ | ------------------------------------------------------------------------- |
| `createOptions` | `SandboxOpts`            | Options for creating a new sandbox. Defaults to `{}`.                     |
| `directoryPath` | `string`                 | Working directory path within the sandbox. Defaults to `/vercel/sandbox`. |
| `env`           | `Record<string, string>` | Environment variables to set when running commands.                       |

## Contributing

Contributions to the AI Code Agents SDK are welcome and highly appreciated. Please review the [contributing guidelines](https://github.com/felixarntz/ai-code-agents/blob/main/CONTRIBUTING.md) to learn more about how you can contribute.
