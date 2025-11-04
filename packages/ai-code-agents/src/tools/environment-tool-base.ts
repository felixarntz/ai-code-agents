import type { ToolCallOptions } from 'ai';
import type {
  EnvironmentToolInterface,
  ToolConfig as ToolBaseConfig,
} from '../types';
import { ToolBase, type ToolMetadata } from './tool-base';

export type EnvironmentToolMetadata<ToolInputType, ToolOutputType> =
  ToolMetadata<ToolInputType, ToolOutputType>;

/**
 * Base class for an execution environment tool.
 */
export abstract class EnvironmentToolBase<
    ToolConfig extends ToolBaseConfig,
    ToolInputType,
    ToolOutputType,
    EnvironmentType,
  >
  extends ToolBase<ToolConfig, ToolInputType, ToolOutputType>
  implements
    EnvironmentToolInterface<ToolInputType, ToolOutputType, EnvironmentType>
{
  protected readonly _environment: EnvironmentType;

  /**
   * Constructs a new `EnvironmentToolBase` instance.
   *
   * @param environment - The execution environment to apply the tool in.
   * @param toolConfig - Optional tool config, can be used to override some defaults.
   */
  constructor(environment: EnvironmentType, toolConfig?: ToolConfig) {
    super(toolConfig);

    this._environment = environment;
  }

  /**
   * Gets the current execution environment for the tool.
   *
   * @returns The current execution environment.
   */
  get environment(): EnvironmentType {
    return this._environment;
  }

  /**
   * Executes the tool with the given input.
   *
   * @param input - The input for the tool.
   * @param _options - Options from the tool call.
   * @returns A promise that resolves to the tool execution result.
   */
  override execute(
    input: ToolInputType,
    _options: ToolCallOptions,
  ): Promise<ToolOutputType> {
    return this.executeForEnvironment(this._environment, input);
  }

  /**
   * Returns the metadata for the tool.
   *
   * The name, description, and needsApproval properties are defaults which can be overridden in the constructor.
   *
   * @returns The tool metadata.
   */
  protected abstract override getMetadata(): EnvironmentToolMetadata<
    ToolInputType,
    ToolOutputType
  >;

  /**
   * Executes the tool in the given execution environment with the given input.
   *
   * @param env - The execution environment to use.
   * @param input - The input for the tool.
   * @returns A promise that resolves to the tool execution result.
   */
  protected abstract executeForEnvironment(
    env: EnvironmentType,
    input: ToolInputType,
  ): Promise<ToolOutputType>;
}
