import {
  createCodeAgent,
  createEnvironment,
  EnvironmentNames,
  EnvironmentToolSafetyLevels,
  type EnvironmentName,
  type EnvironmentToolSafetyLevel,
} from 'ai-code-agents';
import {
  getArgs,
  getOpt,
  type HandlerArgs,
  type OptionsInput,
} from '../util/commander';
import { logger } from '../util/logger';
import { normalizeAbsolutePath } from '../util/paths';
import { output } from '../util/output';

export const name = 'code-agent';
export const description = 'Runs a code agent to perform a specified task.';

export const options = [
  {
    argname: 'task',
    description: 'Task for the agent',
    positional: true,
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
    description:
      'ID of the environment, if relevant (e.g. Docker container ID)',
    choices: EnvironmentToolSafetyLevels,
    default: 'readonly',
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

type CommandConfig = {
  environment: EnvironmentName;
  model: string;
  directory: string;
  tools: EnvironmentToolSafetyLevel;
  environmentId?: string;
  system?: string;
};

const parseOptions = (opt: OptionsInput): CommandConfig => {
  const config: CommandConfig = {
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
  const [task] = getArgs(handlerArgs);
  const { model, environment, directory, tools, environmentId, system } =
    parseOptions(getOpt(handlerArgs));

  const modelSuffix = model ? ` (using model ${model})` : '';
  logger.debug(
    `Running task "${task}" in ${environment} about code in ${directory}${modelSuffix}...`,
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
    system,
  });
  const result = await agent.generate({ prompt: task });
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
