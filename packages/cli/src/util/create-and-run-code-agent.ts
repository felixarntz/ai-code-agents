import {
  createCodeAgent,
  type Environment,
  type ToolsDefinition,
} from 'ai-code-agents';
import { output, logger } from '@felixarntz/cli-utils';

/**
 * Options for creating and running a code agent.
 */
export interface CreateAndRunCodeAgentOptions {
  /**
   * The environment to run the agent in.
   */
  environment: Environment;
  /**
   * Definition of tools to make available to the agent.
   */
  environmentToolsDefinition: ToolsDefinition;
  /**
   * Model identifier to use for the agent.
   */
  model: string;
  /**
   * Prompt/task for the agent to execute.
   */
  prompt: string;
  /**
   * System instruction to guide the agent behavior.
   */
  system?: string;
  /**
   * Maximum number of steps the agent can take.
   */
  maxSteps?: number;
  /**
   * Directory path being worked on.
   */
  directory: string;
}

/**
 * Creates and runs a code agent with the given options.
 *
 * @param options - The options for creating and running the code agent
 */
export const createAndRunCodeAgent = async (
  options: CreateAndRunCodeAgentOptions,
): Promise<void> => {
  const {
    environment,
    environmentToolsDefinition,
    model,
    prompt,
    system,
    maxSteps = 10,
    directory,
  } = options;

  const modelSuffix = model ? ` (using model ${model})` : '';
  logger.debug(
    `Running task prompt in ${environment.name} about code in ${directory}${modelSuffix}...`,
  );

  const agent = createCodeAgent({
    model,
    environment,
    environmentToolsDefinition,
    maxSteps,
    instructions: system,
    logStep: (log: string) => {
      logger.debug('\n' + log);
    },
  });

  const result = await agent.generate({ prompt });
  const { text } = result;

  output(text);
};
