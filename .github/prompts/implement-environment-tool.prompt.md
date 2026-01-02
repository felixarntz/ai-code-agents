---
agent: Plan
---
Your task is to guide the implementation of a new environment tool for the AI Code Agents package. The workflow ensures proper design of data structures (input/output schemas) before implementation, following the established architectural patterns. The output will be a fully implemented and tested environment tool that integrates with the existing tool ecosystem.

<detailed_sequence_steps>

## Step 1: Define Tool Purpose and Requirements

1. Ask the user to describe the specific purpose and functionality of the new environment tool.

- What operation should the tool perform?
- What problem does it solve?
- Are there any similar existing tools to reference?

2. Determine which environment interface the tool should use:

- `FilesystemEnvironmentInterface` - for file operations only
- `CommandLineEnvironmentInterface` - for file operations + command execution
- Custom interface - if new environment methods are needed

3. Identify if the tool needs approval before execution (`needsApproval` flag):

- Set to `true` for potentially destructive operations (delete, overwrite, execute commands)
- Set to `false` for read-only or safe operations

## Step 2: Design Input Schema

1. Define the tool's input parameters using Zod schemas:

- Identify all required parameters
- Identify all optional parameters
- Add descriptive metadata for each parameter using `.meta({ description: '...' })`

2. Create the input schema structure:

```typescript
export const [ToolName]ToolInput = z.object({
  parameterName: z.string().meta({
    description: 'Clear description of the parameter.',
  }),
  // Additional parameters...
});

export type [ToolName]ToolInput = z.infer<typeof [ToolName]ToolInput>;
```

3. Present the proposed input schema to the user for confirmation.

- Explain each parameter and its purpose
- Ask if any parameters should be added, removed, or modified

## Step 3: Design Output Schema

1. Determine what information the tool should return:

- What data is essential for the user to know about the operation?
- What data might be useful for debugging or logging?
- Should it return the same data structure as existing similar tools?

2. Check if a suitable result type already exists in `types.ts`:

- Review existing result types: `ReadFileResult`, `WriteFileResult`, `DeleteFileResult`, `MoveFileResult`, `CopyFileResult`, `RunCommandResult`
- If a suitable type exists, use it
- If not, define a new result type in `types.ts`

3. Create the output schema structure:

```typescript
export const [ToolName]ToolOutput = [ExistingResult or NewResult];

export type [ToolName]ToolOutput = z.infer<typeof [ToolName]ToolOutput>;
```

4. If appropriate, reuse `[Operation]Result` types from `types.ts`. NEVER create new result types in that file though!

5. Present the proposed output schema to the user for confirmation.

- Explain what data will be returned
- Ask if any fields should be added, removed, or modified

## Step 4: Confirm Environment Interface

1. Based on the tool's requirements, confirm the environment interface:

- If only file operations are needed, use `FilesystemEnvironmentInterface`
- If command execution is needed, use `CommandLineEnvironmentInterface`
- If new environment methods are needed, note that the environment interface must be extended first

2. If new environment methods are required:

- Define the method signature
- Determine which environment base class to extend
- Plan to implement the method in relevant environment classes before proceeding

3. Get user confirmation on the environment interface choice.

## Step 5: Implement Tool Class

1. Create the tool implementation file: `packages/ai-code-agents/src/tools/[tool-name]-tool.ts`

2. Implement the tool class following this structure:

```typescript
import { z } from 'zod';
import {
  type [EnvironmentInterface],
  type ToolConfig,
  type ToolExample,
  type ModelFormattedToolResult,
} from '../types';
import {
  EnvironmentToolBase,
  type EnvironmentToolMetadata,
} from './environment-tool-base';

export const [ToolName]ToolName = '[tool_name]';

export type [ToolName]ToolConfig = ToolConfig;

export const [ToolName]ToolInput = z.object({
  // Input schema from Step 2
});

export type [ToolName]ToolInput = z.infer<typeof [ToolName]ToolInput>;

export const [ToolName]ToolOutput = z.object({
  // Output schema from Step 3
});

export type [ToolName]ToolOutput = z.infer<typeof [ToolName]ToolOutput>;

/**
 * Class for the [ToolName] tool.
 */
export class [ToolName]Tool extends EnvironmentToolBase<
  [ToolName]ToolConfig,
  [ToolName]ToolInput,
  [ToolName]ToolOutput,
  [EnvironmentInterface]
> {
  /**
   * Returns the metadata for the tool.
   *
   * The name, description, and needsApproval properties are defaults which can be overridden in the constructor.
   *
   * @returns The tool metadata.
   */
  protected getMetadata(): EnvironmentToolMetadata<
    [ToolName]ToolInput,
    [ToolName]ToolOutput
  > {
    return {
      name: [ToolName]ToolName,
      description: 'Clear description of what the tool does.',
      inputSchema: [ToolName]ToolInput,
      outputSchema: [ToolName]ToolOutput,
      needsApproval: false, // or true based on Step 1
    };
  }

  /**
   * Executes the tool in the given execution environment with the given input.
   *
   * @param env - The execution environment to use.
   * @param input - The input for the tool.
   * @returns A promise that resolves to the tool execution result.
   */
  protected executeForEnvironment(
    env: [EnvironmentInterface],
    input: [ToolName]ToolInput,
  ): Promise<[ToolName]ToolOutput> {
    // Implementation that calls environment methods
    return env.[environmentMethod](input.parameter1, input.parameter2);
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param output - The output from the tool execution.
   * @returns The formatted tool result.
   */
  toModelOutput(output: [ToolName]ToolOutput): ModelFormattedToolResult {
    return {
      type: 'text',
      value: `Formatted message describing the result.`,
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<ToolExample<[ToolName]ToolInput, [ToolName]ToolOutput>> {
    return [
      {
        input: {
          // Example input
        },
        output: 'Example formatted output string.',
      },
    ];
  }
}
```

3. Ensure all JSDoc comments are complete and follow TSDoc standards.

4. Run `pnpm format` to format the code.

5. Run `pnpm lint` to check for linting errors.

## Step 6: Write Unit Tests

1. Create the test file: `packages/ai-code-agents/src/tools/[tool-name]-tool.test.ts`

2. Implement comprehensive tests following this structure:

```typescript
import { describe, expect, it, vi, type Mock } from 'vitest';
import { z } from 'zod';
import type { [EnvironmentInterface] } from '../types';
import { [ToolName]Tool } from './[tool-name]-tool';

describe('[ToolName]Tool', () => {
  const mockEnv: [EnvironmentInterface] = {
    name: 'mock-env',
    // Mock all required environment methods
    [environmentMethod]: vi.fn(),
    // ... other methods
  };

  it('should have the correct metadata', () => {
    const tool = new [ToolName]Tool(mockEnv);

    expect(tool.name).toBe('[tool_name]');
    expect(tool.description).toBe('Expected description');
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeDefined();
    expect(tool.needsApproval).toBe(false); // or true
  });

  it('should call the environment [environmentMethod] method with the correct arguments', async () => {
    const tool = new [ToolName]Tool(mockEnv);
    const input = {
      // Test input
    };

    await tool.execute(input, {} as never);

    expect(mockEnv.[environmentMethod]).toHaveBeenCalledExactlyOnceWith(
      input.parameter1,
      input.parameter2,
    );
  });

  it('should return the result from the environment [environmentMethod] method', async () => {
    const expectedResult = { /* expected result */ };
    (mockEnv.[environmentMethod] as Mock).mockResolvedValue(expectedResult);

    const tool = new [ToolName]Tool(mockEnv);
    const input = {
      // Test input
    };

    const result = await tool.execute(input, {} as never);

    expect(result).toBe(expectedResult);
  });

  // Add more test cases for edge cases, error handling, etc.
});
```

3. Run `pnpm test [tool-name]-tool.test.ts` to verify tests pass.

4. Run `pnpm format` to format the test file.

## Step 7: Update Tool Exports

1. Add the tool export to `packages/ai-code-agents/src/index.ts`:

```typescript
export * from './tools/[tool-name]-tool';
```

2. Update `packages/ai-code-agents/src/tool-creators.ts`:

- Import the new tool class and the tool name.
- Add the tool name and class to the `const availableEnvironmentTools` and the `type EnvironmentToolClasses`.
- Add a case in the `createEnvironmentTool` function:
  ```typescript
  case '[tool_name]':
    return new [ToolName]Tool(environment, config) as EnvironmentToolInterface<
      unknown,
      unknown,
      Environment
    >;
  ```
- Use `ask_followup_question` to check with the user whether the tool should be considered a readonly tool or a dangerous tool. If yes, add it to the `const readonlyTools` list or the `const dangerousTools` list respectively.

3. Update the test file `packages/ai-code-agents/src/tool-creators.test.ts`:

- Amend the tests that cover "readonly" or "dangerous" tools to include the new tool as appropriate.

4. Update `packages/ai-code-agents/src/tool-compat.ts`:

- Import the new tool name and its config, input and output types.
- Implement a `create[ToolName]Tool` function, similar to the existing functions for the other tools.

## Step 8: Run Quality Checks

1. Run all quality checks to ensure the implementation meets project standards:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
```

2. Fix any issues that arise from the quality checks.

3. Verify that all tests pass and there are no linting or type errors.

## Step 9: Complete Implementation

1. Present a summary of the implementation to the user:

- Tool name and purpose
- Input parameters
- Output structure
- Environment interface used
- Test coverage
- Integration status

2. Provide example usage code showing how to use the new tool.

3. Ask if any adjustments or additional features are needed.

</detailed_sequence_steps>

<important_reminders>

- **NEVER**, under NO circumstances, modify `types.ts`.
- **NEVER**, under NO circumstances, modify environment interfaces or implementations. ONLY create the new tool.

</important_reminders>
