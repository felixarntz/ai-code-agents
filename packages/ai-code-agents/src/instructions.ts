import type { Tool } from '@ai-sdk/provider-utils';
import type { ToolExample } from './types';
import { SubmitToolName } from './tools/submit-tool';

type AdditionalInstructionsConfig = {
  maxSteps: number;
  allowSubmit?: boolean;
  tools: Record<string, Tool>;
};

/**
 * Generates additional instructions for the AI model based on the provided configuration.
 *
 * @param config - Configuration object containing maxSteps and tools.
 * @returns A string containing the additional instructions, to append to the system prompt.
 */
export function getAdditionalInstructions(
  config: AdditionalInstructionsConfig,
) {
  const { maxSteps, allowSubmit, tools } = config;

  const exampleSections: string[] = [];
  for (const [toolName, tool] of Object.entries(tools)) {
    if (
      'examples' in tool &&
      Array.isArray(tool.examples) &&
      tool.examples.length > 0
    ) {
      let toolSection = `### Tool: \`${toolName}\`\n\n`;
      for (const example of tool.examples) {
        toolSection += formatExampleForInstructions(toolName, example);
      }
      exampleSections.push(toolSection.trim());
    }
  }

  const workflowGuidelines: string[] = [
    /*
     * If there are examples, the tool information is already mentioned in a separate Tool Examples section.
     * Therefore the line below is only relevant if there are no examples.
     */
    ...(!exampleSections.length
      ? [
          'You have access to several tools to assist you in completing your task.',
        ]
      : []),
    'You must issue tool calls to complete your task. Do not engage with the user directly.',
    ...(allowSubmit
      ? [
          `Once you think you have completed your task, call the \`${SubmitToolName}\` tool to submit your results.`,
        ]
      : []),
    `You have a maximum of ${maxSteps} steps to complete your task.`,
  ];

  const importantWorkflowGuidelines = `## Important Workflow Guidelines

${workflowGuidelines.map((line) => `- ${line}`).join('\n')}

Remember, you don't get to ask the user any clarifying questions, just use the tools available to complete your task. You're on your own now.
`;

  if (exampleSections.length) {
    return (
      `## Tool Examples

You have access to several tools to assist you in completing your task. Here are some examples of how to use them:

${exampleSections.join('\n\n')}

` + importantWorkflowGuidelines
    );
  }

  return importantWorkflowGuidelines;
}

/**
 * Formats a tool example for inclusion in the model instructions.
 *
 * @param toolName - The name of the tool.
 * @param example - The tool example to format.
 * @returns The formatted tool example string.
 */
export function formatExampleForInstructions<ToolInputType, ToolOutputType>(
  toolName: string,
  example: ToolExample<ToolInputType, ToolOutputType>,
): string {
  const input: string | number =
    typeof example.input === 'undefined'
      ? ''
      : typeof example.input === 'string' || typeof example.input === 'number'
        ? example.input
        : JSON.stringify(example.input, null, 2);
  const output: string | number =
    typeof example.output === 'undefined'
      ? ''
      : typeof example.output === 'string' || typeof example.output === 'number'
        ? example.output
        : JSON.stringify(example.output, null, 2);

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
