import {
  createEnvironment,
  EnvironmentToolSafetyLevels,
  type EnvironmentToolSafetyLevel,
} from 'ai-code-agents';
import {
  getOpt,
  type HandlerArgs,
  type OptionsInput,
  type Option,
  parseFileOptions,
  injectFileOptionsForCommander,
  promptMissingOptions,
  stripOptionFieldsForCommander,
  normalizeAbsolutePath,
} from '@felixarntz/cli-utils';
import { createAndRunCodeAgent } from '../util/create-and-run-code-agent';

export const name = 'mock-filesystem-code-agent';
export const description =
  'Runs a code agent on a mock filesystem to perform a specified task.';

const actualOptions: Option[] = [
  {
    argname: '-p, --prompt <prompt>',
    description: 'Task prompt for the agent',
    required: true,
  },
  {
    argname: '-m, --model <model>',
    description: 'Model to use for the agent',
    required: true,
  },
  {
    argname: '-d, --directory <directory>',
    description: 'Directory with the project to work on',
    parse: (value: string) => normalizeAbsolutePath(value),
    required: true,
  },
  {
    argname: '-t, --tools <tools>',
    description: 'Tools to allow the agent to use in the environment',
    choices: EnvironmentToolSafetyLevels,
    defaults: 'readonly',
  },
  {
    argname: '-s, --system <system>',
    description: 'System instruction to guide the agent',
  },
];

export const options = injectFileOptionsForCommander(actualOptions, [
  'prompt',
  'system',
]).map((option) => stripOptionFieldsForCommander(option));

type CommandConfig = {
  prompt: string;
  model: string;
  directory: string;
  tools: EnvironmentToolSafetyLevel;
  system?: string;
};

const parseOptions = (opt: OptionsInput): CommandConfig => {
  const config: CommandConfig = {
    prompt: String(opt['prompt']),
    model: opt['model'] ? String(opt['model']) : '',
    directory: opt['directory'] ? String(opt['directory']) : '',
    tools: opt['tools']
      ? (opt['tools'] as EnvironmentToolSafetyLevel)
      : 'readonly',
  };
  if (opt['system']) {
    config.system = String(opt['system']);
  }
  return config;
};

export const handler = async (...handlerArgs: HandlerArgs): Promise<void> => {
  const { prompt, model, directory, tools, system } = parseOptions(
    await promptMissingOptions(
      actualOptions,
      await parseFileOptions(getOpt(handlerArgs), ['prompt', 'system']),
    ),
  );

  await createAndRunCodeAgent({
    environment: createEnvironment('mock-filesystem', {
      directoryPath: directory,
    }),
    environmentToolsDefinition: tools,
    model,
    prompt,
    system,
    directory,
  });
};
