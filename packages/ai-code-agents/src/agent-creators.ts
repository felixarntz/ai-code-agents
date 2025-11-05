import type { Tool } from '@ai-sdk/provider-utils';
import {
  Experimental_Agent as Agent,
  type Experimental_AgentSettings as AgentSettings,
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

export type CodeAgentCreatorConfig = AgentSettings<Record<string, Tool>> & {
  maxSteps: number;
  allowSubmit?: boolean;
  logStep?: (stepLog: string, stepIndex: number) => void;
  omitAdditionalInstructions?: boolean;
} & (
    | {
        environment: Environment;
        environmentToolsDefinition: ToolsDefinition;
      }
    | {
        environments: Record<string, Environment>;
        environmentToolsDefinition: Record<string, ToolsDefinition>;
      }
    | Record<string, never>
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FirstFunctionArgument<T> = T extends (arg1: infer U, ...args: any[]) => any
  ? U
  : never;

/**
 * Creates an AI code agent configured to operate on one or more specified execution environments with tools.
 *
 * @param agentConfig - Configuration options for the code agent, including environments, tools definition, and agent settings.
 * @returns An instance of Agent configured with the specified environment tools and settings.
 */
export function createCodeAgent(
  agentConfig: CodeAgentCreatorConfig,
): Agent<Record<string, Tool>> {
  const {
    maxSteps,
    allowSubmit,
    logStep,
    omitAdditionalInstructions,
    tools: originalTools,
    stopWhen: originalStopWhen,
    prepareStep: originalPrepareStep,
    system: originalSystemInstruction,
    ...remainingConfig
  } = agentConfig;

  let agentSettings: AgentSettings<Record<string, Tool>>;
  let environmentTools:
    | ReturnType<typeof createToolsForEnvironment>
    | undefined;
  if ('environments' in remainingConfig) {
    const { environments, environmentToolsDefinition, ...agentSettingsInput } =
      remainingConfig;
    agentSettings = { ...agentSettingsInput };

    environmentTools = {};
    for (const [environmentName, environment] of Object.entries(environments)) {
      if (!(environmentName in environmentToolsDefinition)) {
        throw new Error(
          `No tools definition provided for environment "${environmentName}". Please provide a tools definition for each environment.`,
        );
      }
      const environmentTools = createToolsForNamedEnvironment(
        environmentName,
        environment,
        environmentToolsDefinition[environmentName],
      );
      for (const [toolName, tool] of Object.entries(environmentTools)) {
        if (toolName in environmentTools) {
          throw new Error(
            `Tool name conflict: The tool name "${toolName}" from environment "${environmentName}" is already used by another environment's tools.`,
          );
        }
        environmentTools[toolName] = tool;
      }
    }
  } else if ('environment' in remainingConfig) {
    const { environment, environmentToolsDefinition, ...agentSettingsInput } =
      remainingConfig;
    agentSettings = { ...agentSettingsInput };

    environmentTools = createToolsForEnvironment(
      environment,
      environmentToolsDefinition,
    );
  } else {
    agentSettings = { ...remainingConfig };
  }

  const tools =
    environmentTools && originalTools
      ? mergeTools(environmentTools, originalTools)
      : originalTools || environmentTools || {};

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

  const system = !omitAdditionalInstructions
    ? mergeSystemInstructions(
        originalSystemInstruction,
        getAdditionalInstructions({ maxSteps, allowSubmit, tools }),
      )
    : originalSystemInstruction;

  return new Agent({
    ...agentSettings,
    system,
    prepareStep,
    stopWhen,
  });
}

/**
 * Merges two sets of tools into one, ensuring no name conflicts.
 *
 * @param baseTools - The base set of tools.
 * @param additionalTools - Additional tools to merge into the base set.
 * @returns A new record containing all tools from both sets.
 */
function mergeTools(
  baseTools: Record<string, Tool>,
  additionalTools: Exclude<
    AgentSettings<Record<string, Tool>>['tools'],
    undefined
  >,
): Record<string, Tool> {
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
  baseStopWhen: Exclude<
    AgentSettings<Record<string, Tool>>['stopWhen'],
    undefined
  >,
  additionalStopWhen: Exclude<
    AgentSettings<Record<string, Tool>>['stopWhen'],
    undefined
  >,
): Exclude<AgentSettings<Record<string, Tool>>['stopWhen'], undefined> {
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
 * @param baseSystem - The base system instructions, or undefined if none.
 * @param additionalInstructions - The additional instructions to append.
 * @returns The merged system instructions.
 */
function mergeSystemInstructions(
  baseSystem: string | undefined,
  additionalInstructions: string,
): string {
  if (baseSystem) {
    return `${baseSystem.trimEnd()}\n\n${additionalInstructions}`;
  }
  return additionalInstructions;
}
