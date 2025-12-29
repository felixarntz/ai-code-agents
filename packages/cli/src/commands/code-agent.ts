import {
  createCodeAgent,
  createEnvironment,
  EnvironmentNames,
  EnvironmentToolSafetyLevels,
  type EnvironmentName,
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
  logger,
  output,
  normalizeAbsolutePath,
} from '@felixarntz/cli-utils';

export const name = 'code-agent';
export const description = 'Runs a code agent to perform a specified task.';

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
    argname: '-e, --environment <environment>',
    description: 'Environment type to use',
    choices: EnvironmentNames,
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
    argname: '-i, --environment-id <environment-id>',
    description:
      'ID of the environment, if relevant (e.g. Docker container ID)',
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
  environment: EnvironmentName;
  model: string;
  directory: string;
  tools: EnvironmentToolSafetyLevel;
  environmentId?: string;
  system?: string;
};

const parseOptions = (opt: OptionsInput): CommandConfig => {
  const config: CommandConfig = {
    prompt: String(opt['prompt']),
    model: opt['model'] ? String(opt['model']) : '',
    environment: opt['environment'] as EnvironmentName,
    directory: opt['directory'] ? String(opt['directory']) : '',
    tools: opt['tools']
      ? (opt['tools'] as EnvironmentToolSafetyLevel)
      : 'readonly',
  };
  if (opt['environment-id']) {
    config.environmentId = String(opt['environment-id']);
  }
  if (opt['system']) {
    config.system = String(opt['system']);
  }
  return config;
};

export const handler = async (...handlerArgs: HandlerArgs): Promise<void> => {
  const {
    prompt,
    model,
    environment,
    directory,
    tools,
    environmentId,
    system,
  } = parseOptions(
    await promptMissingOptions(
      actualOptions,
      await parseFileOptions(getOpt(handlerArgs), ['prompt', 'system']),
    ),
  );

  const modelSuffix = model ? ` (using model ${model})` : '';
  logger.debug(
    `Running task prompt in ${environment} about code in ${directory}${modelSuffix}...`,
  );

  const environmentConfig = createEnvironmentConfig(
    environment,
    directory,
    environmentId,
  );

  const agent = createCodeAgent({
    model,
    environment: createEnvironment(environment, environmentConfig),
    environmentToolsDefinition: tools,
    maxSteps: 10,
    logStep: (log: string) => {
      logger.debug('\n' + log);
    },
    instructions: system,
  });
  const result = await agent.generate({ prompt });
  const { text } = result;

  output(text);
};

const createEnvironmentConfig = (
  environment: EnvironmentName,
  directory: string,
  environmentId?: string,
) => {
  const config = {
    directoryPath: directory,
  };
  if (environment === 'docker' && environmentId) {
    return {
      ...config,
      containerId: environmentId,
    };
  }
  return config;
};
