import type { Tool } from '@ai-sdk/provider-utils';
import {
  ToolLoopAgent,
  type ToolLoopAgentSettings,
  type SystemModelMessage,
  stepCountIs,
  hasToolCall,
} from 'ai';
import { getAdditionalInstructions } from './instructions';
import {
  createToolsForEnvironment,
  createToolsForNamedEnvironment,
  type ToolsDefinition,
} from './tool-creators';
import type { Environment } from './types';
import { SubmitTool, SubmitToolName } from './tools/submit-tool';
import { getStepLog } from './util/get-step-log';

type FlexibleAgent = ToolLoopAgent<never, Record<string, Tool>>;
type FlexibleAgentSettings = ToolLoopAgentSettings<never, Record<string, Tool>>;

export type CodeAgentToolsCreatorConfig =
  | {
      environment: Environment;
      environmentToolsDefinition: ToolsDefinition;
    }
  | {
      environments: Record<string, Environment>;
      environmentToolsDefinition: Record<string, ToolsDefinition>;
    };

export type CodeAgentCreatorConfig = FlexibleAgentSettings & {
  maxSteps: number;
  allowSubmit?: boolean;
  logStep?: (stepLog: string, stepIndex: number) => void;
  omitAdditionalInstructions?: boolean;
} & (CodeAgentToolsCreatorConfig | Record<string, never>);

type FlexibleAgentTools = Exclude<FlexibleAgentSettings['tools'], undefined>;

type FlexibleAgentStopWhen = Exclude<
  FlexibleAgentSettings['stopWhen'],
  undefined
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FirstFunctionArgument<T> = T extends (arg1: infer U, ...args: any[]) => any
  ? U
  : never;

/**
 * Creates an AI code agent configured to operate on one or more specified execution environments with tools.
 *
 * @param agentConfig - Configuration options for the code agent, including environments, tools definition, and agent settings.
 * @returns An agent instance configured with the specified environment tools and settings.
 */
export function createCodeAgent(
  agentConfig: CodeAgentCreatorConfig,
): FlexibleAgent {
  return new ToolLoopAgent(createCodeAgentSettings(agentConfig));
}

/**
 * Creates settings object for an AI code agent configured to operate on one or more specified execution environments with tools.
 *
 * @param agentConfig - Configuration options for the code agent, including environments, tools definition, and agent settings.
 * @returns An agent settings object configured with the specified environment tools and settings.
 */
export function createCodeAgentSettings(
  agentConfig: CodeAgentCreatorConfig,
): FlexibleAgentSettings {
  const {
    maxSteps,
    allowSubmit,
    logStep,
    omitAdditionalInstructions,
    tools: originalTools,
    stopWhen: originalStopWhen,
    prepareStep: originalPrepareStep,
    instructions: originalSystemInstruction,
    ...remainingConfig
  } = agentConfig;

  let agentSettings: FlexibleAgentSettings;
  let tools: FlexibleAgentTools;
  if ('environments' in remainingConfig) {
    const { environments, environmentToolsDefinition, ...agentSettingsInput } =
      remainingConfig;
    agentSettings = { ...agentSettingsInput };

    tools = createCodeAgentTools(
      { environments, environmentToolsDefinition },
      originalTools,
    );
  } else if ('environment' in remainingConfig) {
    const { environment, environmentToolsDefinition, ...agentSettingsInput } =
      remainingConfig;
    agentSettings = { ...agentSettingsInput };

    tools = createCodeAgentTools(
      { environment, environmentToolsDefinition },
      originalTools,
    );
  } else {
    agentSettings = { ...remainingConfig };

    tools = originalTools || {};
  }

  if (allowSubmit) {
    if (SubmitToolName in tools) {
      throw new Error(
        `Tool name conflict: The Submit tool name "${SubmitToolName}" is already used by another tool.`,
      );
    }
    tools[SubmitToolName] = new SubmitTool();
  }

  if (Object.keys(tools).length > 0) {
    agentSettings.tools = tools;
  }

  let stepCount = 0;
  const prepareStep = logStep
    ? (prepareStepInput: FirstFunctionArgument<typeof originalPrepareStep>) => {
        const { steps } = prepareStepInput;
        if (steps.length > 0) {
          stepCount += 1;
          const stepLog = getStepLog(steps[steps.length - 1]);
          logStep(`=== Step ${stepCount} ===\n${stepLog}`, stepCount - 1);
        }
        if (originalPrepareStep) {
          return originalPrepareStep(prepareStepInput);
        }
        return undefined;
      }
    : originalPrepareStep;

  const stopWhenCondition = allowSubmit
    ? [stepCountIs(maxSteps), hasToolCall(SubmitToolName)]
    : stepCountIs(maxSteps);
  const stopWhen = originalStopWhen
    ? mergeStopWhen(originalStopWhen, stopWhenCondition)
    : stopWhenCondition;

  const instructions = !omitAdditionalInstructions
    ? mergeSystemInstructions(
        originalSystemInstruction,
        getAdditionalInstructions({ maxSteps, allowSubmit, tools }),
      )
    : originalSystemInstruction;

  return {
    ...agentSettings,
    instructions,
    prepareStep,
    stopWhen,
  };
}

/**
 * Creates agent tools based on the provided configuration.
 *
 * This function generates a set of tools for one or more environments, depending on the configuration.
 * If `environments` is provided, it creates tools for each named environment using the corresponding
 * tools definition. If `environment` is provided, it creates tools for a single environment.
 * The generated tools can be merged with optional original tools.
 *
 * @param agentToolsConfig - The configuration object specifying environments and their tools definitions.
 * @param originalTools - Optional existing tools to merge with the newly created environment tools.
 * @returns An object containing the created agent tools, merged with original tools if provided.
 */
export function createCodeAgentTools(
  agentToolsConfig: CodeAgentToolsCreatorConfig,
  originalTools?: FlexibleAgentTools,
): FlexibleAgentTools {
  if ('environments' in agentToolsConfig) {
    const { environments, environmentToolsDefinition } = agentToolsConfig;

    const environmentTools: Record<string, Tool> = {};
    for (const [environmentName, environment] of Object.entries(environments)) {
      if (!(environmentName in environmentToolsDefinition)) {
        throw new Error(
          `No tools definition provided for environment "${environmentName}". Please provide a tools definition for each environment.`,
        );
      }
      const envTools = createToolsForNamedEnvironment(
        environmentName,
        environment,
        environmentToolsDefinition[environmentName],
      );
      for (const [toolName, tool] of Object.entries(envTools)) {
        if (toolName in environmentTools) {
          throw new Error(
            `Tool name conflict: The tool name "${toolName}" from environment "${environmentName}" is already used by another environment's tools.`,
          );
        }
        environmentTools[toolName] = tool;
      }
    }

    return originalTools
      ? mergeTools(environmentTools, originalTools)
      : environmentTools;
  }

  if ('environment' in agentToolsConfig) {
    const { environment, environmentToolsDefinition } = agentToolsConfig;

    const environmentTools: Record<string, Tool> = createToolsForEnvironment(
      environment,
      environmentToolsDefinition,
    );

    return originalTools
      ? mergeTools(environmentTools, originalTools)
      : environmentTools;
  }

  throw new Error(
    'No environments provided in agent tools configuration. Please provide either "environment" or "environments".',
  );
}

/**
 * Merges two sets of tools into one, ensuring no name conflicts.
 *
 * @param baseTools - The base set of tools.
 * @param additionalTools - Additional tools to merge into the base set.
 * @returns A new record containing all tools from both sets.
 */
function mergeTools(
  baseTools: FlexibleAgentTools,
  additionalTools: FlexibleAgentTools,
): FlexibleAgentTools {
  const tools = { ...baseTools };
  for (const [toolName, tool] of Object.entries(additionalTools)) {
    if (toolName in tools) {
      throw new Error(
        `Tool name conflict: The additional tool name "${toolName}" is already used by the code environment tools.`,
      );
    }
    tools[toolName] = tool;
  }
  return tools;
}

/**
 * Merges two stopWhen conditions into one.
 *
 * @param baseStopWhen - The base stopWhen condition.
 * @param additionalStopWhen - The additional stopWhen condition to merge.
 * @returns A combined stopWhen condition.
 */
function mergeStopWhen(
  baseStopWhen: FlexibleAgentStopWhen,
  additionalStopWhen: FlexibleAgentStopWhen,
): FlexibleAgentStopWhen {
  if (Array.isArray(baseStopWhen)) {
    if (Array.isArray(additionalStopWhen)) {
      return [...baseStopWhen, ...additionalStopWhen];
    }

    return [...baseStopWhen, additionalStopWhen];
  }

  if (Array.isArray(additionalStopWhen)) {
    return [baseStopWhen, ...additionalStopWhen];
  }

  return [baseStopWhen, additionalStopWhen];
}

/**
 * Merges the base system instructions with additional instructions.
 *
 * If no base system instructions are provided, only the additional instructions are returned.
 *
 * @param baseInstructions - The base system instructions, or undefined if none.
 * @param additionalInstructions - The additional instructions to append.
 * @returns The merged system instructions.
 */
function mergeSystemInstructions(
  baseInstructions:
    | string
    | SystemModelMessage
    | SystemModelMessage[]
    | undefined,
  additionalInstructions: string,
): string | SystemModelMessage | SystemModelMessage[] {
  if (baseInstructions) {
    if (Array.isArray(baseInstructions)) {
      return [
        ...baseInstructions,
        {
          role: 'system',
          content: additionalInstructions,
        },
      ];
    }
    if (typeof baseInstructions === 'object') {
      return {
        ...baseInstructions,
        content: `${baseInstructions.content.trimEnd()}\n\n${additionalInstructions}`,
      };
    }
    return `${baseInstructions.trimEnd()}\n\n${additionalInstructions}`;
  }
  return additionalInstructions;
}
