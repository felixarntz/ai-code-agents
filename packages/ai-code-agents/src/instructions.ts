import type { ToolExample } from '@ai-code-agents/environment-utils';
import type { Tool } from '@ai-sdk/provider-utils';
import { SubmitToolName } from './tools/submit-tool';

// See https://github.com/galfrevn/promptsmith.
type ConstraintType = 'must' | 'must_not' | 'should' | 'should_not';
type ConstraintsByType = {
  [key in ConstraintType]?: string[];
};

type ConstraintsConfig = {
  maxSteps: number;
  allowSubmit?: boolean;
};

type AdditionalInstructionsConfig = ConstraintsConfig & {
  tools: Record<string, Tool>;
};

/**
 * Generates additional system instructions for the code agent based on the provided configuration.
 *
 * @param config - Configuration object containing maxSteps and tools.
 * @returns A string containing the additional instructions, to append to the system prompt.
 */
export function getAdditionalInstructions(
  config: AdditionalInstructionsConfig,
): string {
  const { maxSteps, allowSubmit, tools } = config;

  const exampleSections: string[] = [
    '# Tool Examples',
    'You have access to several tools to assist you in completing your task. Here are some examples of how to use them:',
  ];
  for (const [toolName, tool] of Object.entries(tools)) {
    if (
      'examples' in tool &&
      Array.isArray(tool.examples) &&
      tool.examples.length > 0
    ) {
      let toolSection = `## Tool: \`${toolName}\`\n\n`;
      for (const example of tool.examples) {
        toolSection += formatExampleForInstructions(toolName, example);
      }
      exampleSections.push(toolSection.trim());
    }
  }

  const constraintSections: string[] = ['# Behavioral Guidelines'];
  const constraintsByType = getCodeAgentConstraints({ maxSteps, allowSubmit });
  if (constraintsByType.must && constraintsByType.must.length > 0) {
    let constraintSection = '## You MUST:\n\n';
    for (const constraint of constraintsByType.must) {
      constraintSection += `- ${constraint}\n`;
    }
    constraintSections.push(constraintSection.trim());
  }
  if (constraintsByType.must_not && constraintsByType.must_not.length > 0) {
    let constraintSection = '## You MUST NOT:\n\n';
    for (const constraint of constraintsByType.must_not) {
      constraintSection += `- ${constraint}\n`;
    }
    constraintSections.push(constraintSection.trim());
  }
  if (constraintsByType.should && constraintsByType.should.length > 0) {
    let constraintSection = '## You SHOULD:\n\n';
    for (const constraint of constraintsByType.should) {
      constraintSection += `- ${constraint}\n`;
    }
    constraintSections.push(constraintSection.trim());
  }
  if (constraintsByType.should_not && constraintsByType.should_not.length > 0) {
    let constraintSection = '## You SHOULD NOT:\n\n';
    for (const constraint of constraintsByType.should_not) {
      constraintSection += `- ${constraint}\n`;
    }
    constraintSections.push(constraintSection.trim());
  }

  const finalReminder = getCodeAgentFinalReminder();

  return [...exampleSections, ...constraintSections, finalReminder].join(
    '\n\n',
  );
}

/**
 * Formats a tool example for inclusion in the code agent system instructions.
 *
 * @param toolName - The name of the tool.
 * @param example - The tool example to format.
 * @returns The formatted tool example string.
 */
export function formatExampleForInstructions<ToolInputType, ToolOutputType>(
  toolName: string,
  example: ToolExample<ToolInputType, ToolOutputType>,
): string {
  const input = formatValueForExample(example.input);
  const output = formatValueForExample(example.output);

  if (output === '') {
    return `<example>
<tool_call>
${toolName}(${input})
</tool_call>
</example>`;
  }

  return `<example>
<tool_call>
${toolName}(${input})
</tool_call>
<tool_response>
${output}
</tool_response>
</example>`;
}

/**
 * Formats a value for inclusion in a tool example.
 *
 * @param value - The value to format.
 * @returns The formatted value as a string.
 */
function formatValueForExample(value: unknown): string {
  if (typeof value === 'undefined') {
    return '';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return JSON.stringify(value, null, 2);
}

/**
 * Generates constraints for the code agent system instructions based on the provided configuration.
 *
 * The constraints are formatted in accordance with the PromptSmith framework.
 * You can pass them to the prompt builder's `withConstraints` method.
 *
 * @param config - Configuration object containing maxSteps and allowSubmit.
 * @returns An object containing constraints to include in the system prompt, categorized by type.
 */
export function getCodeAgentConstraints(
  config: ConstraintsConfig,
): ConstraintsByType {
  const { maxSteps, allowSubmit } = config;

  return {
    must: [
      'Always issue tool calls to complete your task',
      ...(allowSubmit
        ? [
            `Call the \`${SubmitToolName}\` tool once you think you have completed your task, to submit your results`,
          ]
        : []),
      `Complete your task within ${maxSteps} steps`,
    ],
    must_not: ['Engage with the user directly'],
  };
}

/**
 * Returns a final reminder message for the code agent system instructions.
 *
 * @returns The reminder string.
 */
export function getCodeAgentFinalReminder(): string {
  return "Remember, you don't get to ask the user any clarifying questions, just use the tools available to complete your task. You're on your own now.";
}
