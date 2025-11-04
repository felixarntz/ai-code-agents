import type { ToolCallOptions } from 'ai';
import type {
  ToolInterface,
  ToolConfig as ToolBaseConfig,
  ToolExample,
  ModelFormattedToolResult,
} from '../types';

type FlexibleInputSchema<T> = ToolInterface<T, unknown>['inputSchema'];
type FlexibleOutputSchema<T> = ToolInterface<unknown, T>['outputSchema'];

export type ToolMetadata<ToolInputType, ToolOutputType> = {
  name: string;
  description: string;
  inputSchema: FlexibleInputSchema<ToolInputType>;
  outputSchema: FlexibleOutputSchema<ToolOutputType>;
  needsApproval: boolean;
};

/**
 * Base class for a tool.
 */
export abstract class ToolBase<
  ToolConfig extends ToolBaseConfig,
  ToolInputType,
  ToolOutputType,
> implements ToolInterface<ToolInputType, ToolOutputType>
{
  readonly _toolConfig!: ToolConfig;
  protected readonly _name: string;
  protected readonly _description: string;
  protected readonly _inputSchema: FlexibleInputSchema<ToolInputType>;
  protected readonly _outputSchema: FlexibleOutputSchema<ToolOutputType>;
  protected readonly _needsApproval: boolean;

  /**
   * Constructs a new tool instance.
   *
   * @param toolConfig - Optional tool config, can be used to override some defaults.
   */
  constructor(toolConfig?: ToolConfig) {
    const {
      name: defaultName,
      description: defaultDescription,
      inputSchema,
      outputSchema,
      needsApproval: defaultNeedsApproval,
    } = this.getMetadata();

    this._name = toolConfig?.name || defaultName;
    this._description = toolConfig?.description || defaultDescription;
    this._inputSchema = inputSchema;
    this._outputSchema = outputSchema;
    this._needsApproval =
      toolConfig?.needsApproval !== undefined
        ? toolConfig.needsApproval
        : defaultNeedsApproval;
  }

  /**
   * Gets the tool name.
   *
   * @returns The tool name.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets the tool description.
   *
   * @returns The tool description.
   */
  get description(): string {
    return this._description;
  }

  /**
   * Gets the input schema for the tool.
   *
   * @returns The input schema.
   */
  get inputSchema(): FlexibleInputSchema<ToolInputType> {
    return this._inputSchema;
  }

  /**
   * Gets the input schema for the tool.
   *
   * @returns The input schema.
   */
  get outputSchema(): FlexibleInputSchema<ToolOutputType> {
    return this._outputSchema;
  }

  /**
   * Gets whether the tool needs approval before use.
   *
   * @returns True if the tool needs approval, false otherwise.
   */
  get needsApproval(): boolean {
    return this._needsApproval;
  }

  /**
   * Gets the examples for the tool.
   *
   * @returns The tool examples.
   */
  abstract get examples(): Array<ToolExample<ToolInputType, ToolOutputType>>;

  /**
   * Executes the tool with the given input.
   *
   * @param input - The input for the tool.
   * @param options - Options from the tool call.
   * @returns A promise that resolves to the tool execution result.
   */
  abstract execute(
    input: ToolInputType,
    options: ToolCallOptions,
  ): Promise<ToolOutputType>;

  /**
   * Converts the tool output to a format suitable for model consumption.
   *
   * @param output - The output from the tool execution.
   * @returns The formatted tool result.
   */
  abstract toModelOutput(output: ToolOutputType): ModelFormattedToolResult;

  /**
   * Returns the metadata for the tool.
   *
   * The name, description, and needsApproval properties are defaults which can be overridden in the constructor.
   *
   * @returns The tool metadata.
   */
  protected abstract getMetadata(): ToolMetadata<ToolInputType, ToolOutputType>;
}
