# @ai-code-agents/cli

CLI for exploring the [ai-code-agents](https://www.npmjs.com/package/ai-code-agents) TypeScript SDK.

This package provides a command-line interface for running AI coding agents in various execution environments. It's designed for testing, experimentation, and exploring the capabilities of the AI Code Agents SDK.

## Installation

```bash
npm install -g @ai-code-agents/cli
```

Or run directly with npx:

```bash
npx @ai-code-agents/cli <command> [options]
```

## Commands

### `docker-code-agent`

Runs a code agent in a Docker container to perform a specified task.

**Options:**

| Option                        | Description                                    | Required |
| ----------------------------- | ---------------------------------------------- | -------- |
| `-p, --prompt <prompt>`       | Task prompt for the agent                      | Yes      |
| `-m, --model <model>`         | Model to use for the agent                     | Yes      |
| `-d, --directory <directory>` | Directory with the project to work on          | Yes      |
| `-i, --container-id <id>`     | ID of the Docker container                     | Yes      |
| `-t, --tools <tools>`         | Tools to allow (`readonly`, `basic`, or `all`) | No       |
| `-s, --system <system>`       | System instruction to guide the agent          | No       |

**Example:**

```bash
ai-code-agents docker-code-agent \
  --prompt "Create a simple Express server" \
  --model "openai/gpt-4.1" \
  --directory "/app" \
  --container-id "my-container-id" \
  --tools "all"
```

### `just-bash-code-agent`

Runs a code agent using a simulated bash environment to perform a specified task. This uses the [just-bash](https://www.npmjs.com/package/just-bash) library for an in-memory virtual filesystem and bash shell.

**Options:**

| Option                                    | Description                                                                         | Required |
| ----------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| `-p, --prompt <prompt>`                   | Task prompt for the agent                                                           | Yes      |
| `-m, --model <model>`                     | Model to use for the agent                                                          | Yes      |
| `-d, --directory <directory>`             | Working directory in the simulated bash environment                                 | No       |
| `-l, --local-directory <local-directory>` | Local directory to mount into the simulated environment (excludes gitignored files) | No       |
| `-t, --tools <tools>`                     | Tools to allow (`readonly`, `basic`, or `all`)                                      | No       |
| `-s, --system <system>`                   | System instruction to guide the agent                                               | No       |

**Example:**

```bash
ai-code-agents just-bash-code-agent \
  --prompt "Create a Python script that prints hello world" \
  --model "anthropic/claude-haiku-4-5" \
  --directory "/home/user/project" \
  --tools "basic"
```

**Example with local directory:**

```bash
ai-code-agents just-bash-code-agent \
  --prompt "Analyze the code structure and suggest improvements" \
  --model "openai/gpt-4.1-mini" \
  --local-directory "./my-project" \
  --tools "readonly"
```

### `mock-filesystem-code-agent`

Runs a code agent on a mock filesystem to perform a specified task. Useful for testing and experimentation without affecting real files.

**Options:**

| Option                        | Description                                    | Required |
| ----------------------------- | ---------------------------------------------- | -------- |
| `-p, --prompt <prompt>`       | Task prompt for the agent                      | Yes      |
| `-m, --model <model>`         | Model to use for the agent                     | Yes      |
| `-d, --directory <directory>` | Directory with the project to work on          | Yes      |
| `-t, --tools <tools>`         | Tools to allow (`readonly`, `basic`, or `all`) | No       |
| `-s, --system <system>`       | System instruction to guide the agent          | No       |

**Example:**

```bash
ai-code-agents mock-filesystem-code-agent \
  --prompt "Create a README.md file for this project" \
  --model "google/gemini-3-pro-preview" \
  --directory "/workspace" \
  --tools "basic"
```

### `node-filesystem-code-agent`

Runs a code agent locally using Node.js filesystem operations. Recommended for read-only operations.

**Options:**

| Option                        | Description                                    | Required |
| ----------------------------- | ---------------------------------------------- | -------- |
| `-p, --prompt <prompt>`       | Task prompt for the agent                      | Yes      |
| `-m, --model <model>`         | Model to use for the agent                     | Yes      |
| `-d, --directory <directory>` | Directory with the project to work on          | Yes      |
| `-t, --tools <tools>`         | Tools to allow (`readonly`, `basic`, or `all`) | No       |
| `-s, --system <system>`       | System instruction to guide the agent          | No       |

**Example:**

```bash
ai-code-agents node-filesystem-code-agent \
  --prompt "Analyze the project structure and list all TypeScript files" \
  --model "openai/gpt-4.1" \
  --directory "./my-project" \
  --tools "readonly"
```

### `unsafe-local-code-agent`

Runs a code agent locally with full filesystem and command execution access. **Use with caution—this environment can modify your local files and execute arbitrary commands.**

**Options:**

| Option                        | Description                                    | Required |
| ----------------------------- | ---------------------------------------------- | -------- |
| `-p, --prompt <prompt>`       | Task prompt for the agent                      | Yes      |
| `-m, --model <model>`         | Model to use for the agent                     | Yes      |
| `-d, --directory <directory>` | Directory with the project to work on          | Yes      |
| `-t, --tools <tools>`         | Tools to allow (`readonly`, `basic`, or `all`) | No       |
| `-s, --system <system>`       | System instruction to guide the agent          | No       |

**Example:**

```bash
ai-code-agents unsafe-local-code-agent \
  --prompt "Install dependencies and run the test suite" \
  --model "anthropic/claude-sonnet-4-5" \
  --directory "./my-project" \
  --tools "all"
```

## Tool Safety Levels

All commands support a `--tools` option to control which tools are available to the agent:

- **`readonly`** (default): Only read operations (safe for production). Includes `read_file`, `read_many_files`, `get_project_file_structure`, `glob`, `list_directory`.
- **`basic`**: Read and write operations, no deletions or commands. Adds `write_file`, `edit_file`, `move_file`, `copy_file`.
- **`all`**: Full access including deletions and command execution. Adds `delete_file`, `run_command`.

## Environment Variables

The CLI automatically loads environment variables from a `.env` file in your current directory. This is useful for configuring API keys:

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

## Contributing

Contributions to the AI Code Agents SDK are welcome and highly appreciated. Please review the [contributing guidelines](https://github.com/felixarntz/ai-code-agents/blob/main/CONTRIBUTING.md) to learn more about how you can contribute.
