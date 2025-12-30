import type { ToolExecutionOptions } from 'ai';
import { z } from 'zod';
import type {
  ToolConfig,
  ToolExample,
  ModelToolResultToFormat,
  ModelFormattedToolResult,
} from '../types';
import { ToolBase, type ToolMetadata } from './tool-base';

export const SubmitToolName = 'submit';

export type SubmitToolConfig = ToolConfig;

export const SubmitToolInput = z.object({});

export type SubmitToolInput = z.infer<typeof SubmitToolInput>;

export const SubmitToolOutput = z.object({});

export type SubmitToolOutput = z.infer<typeof SubmitToolOutput>;

/**
 * Class for the Submit tool.
 */
export class SubmitTool extends ToolBase<
  SubmitToolConfig,
  SubmitToolInput,
  SubmitToolOutput
> {
  /**
   * Returns the metadata for the tool.
   *
   * The name, description, and needsApproval properties are defaults which can be overridden in the constructor.
   *
   * @returns The tool metadata.
   */
  protected getMetadata(): ToolMetadata<SubmitToolInput, SubmitToolOutput> {
    return {
      name: SubmitToolName,
      description: 'Submits the current task, indicating that it is completed.',
      inputSchema: SubmitToolInput,
      outputSchema: SubmitToolOutput,
      needsApproval: false,
    };
  }

  /**
   * Executes the tool with the given input.
   *
   * @param _ - The input for the tool. Unused.
   * @param __ - Options for the tool execution. Unused.
   * @returns A promise that resolves to the tool execution result.
   */
  async execute(
    _: SubmitToolInput,
    __: ToolExecutionOptions,
  ): Promise<SubmitToolOutput> {
    return {};
  }

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param _ - The tool result, including the output from the tool execution. Unused.
   * @returns The formatted tool result.
   */
  toModelOutput(
    _: ModelToolResultToFormat<SubmitToolInput, SubmitToolOutput>,
  ): ModelFormattedToolResult {
    return {
      type: 'text',
      value: `Task submitted successfully.`,
    };
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  get examples(): Array<ToolExample<SubmitToolInput, SubmitToolOutput>> {
    return [];
  }
}
