import {
  EnvironmentToolSafetyLevels,
  type EnvironmentToolSafetyLevel,
} from 'ai-code-agents';
import { JustBashEnvironment } from '@ai-code-agents/just-bash';
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
  normalizeAbsolutePath,
} from '@felixarntz/cli-utils';
import { createAndRunCodeAgent } from '../util/create-and-run-code-agent';
import { readLocalDirectoryFiles } from '../util/read-local-directory-files';

export const name = 'just-bash-code-agent';
export const description =
  'Runs a code agent using a simulated bash environment to perform a specified task.';

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
    description: 'Working directory in the simulated bash environment',
    parse: (value: string) => normalizeAbsolutePath(value),
  },
  {
    argname: '-t, --tools <tools>',
    description: 'Tools to allow the agent to use in the environment',
    choices: EnvironmentToolSafetyLevels,
    defaults: 'readonly',
  },
  {
    argname: '-l, --local-directory <local-directory>',
    description:
      'Local directory to mount into the simulated environment (reads all files excluding gitignored)',
    parse: (value: string) => normalizeAbsolutePath(value),
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
  tools: EnvironmentToolSafetyLevel;
  directory?: string;
  localDirectory?: string;
  system?: string;
};

const parseOptions = (opt: OptionsInput): CommandConfig => {
  const config: CommandConfig = {
    prompt: String(opt['prompt']),
    model: opt['model'] ? String(opt['model']) : '',
    tools: opt['tools']
      ? (opt['tools'] as EnvironmentToolSafetyLevel)
      : 'readonly',
  };
  if (opt['directory']) {
    config.directory = String(opt['directory']);
  }
  if (opt['local-directory']) {
    config.localDirectory = String(opt['local-directory']);
  }
  if (opt['system']) {
    config.system = String(opt['system']);
  }
  return config;
};

export const handler = async (...handlerArgs: HandlerArgs): Promise<void> => {
  const { prompt, model, directory, tools, localDirectory, system } =
    parseOptions(
      await promptMissingOptions(
        actualOptions,
        await parseFileOptions(getOpt(handlerArgs), ['prompt', 'system']),
      ),
    );

  let files: Record<string, string> | undefined = undefined;
  if (localDirectory) {
    logger.debug(`Reading files from local directory at ${localDirectory}...`);
    files = await readLocalDirectoryFiles(localDirectory);
    logger.debug(
      `Mounting ${Object.keys(files).length} files into the simulated bash environment...`,
    );
  }

  await createAndRunCodeAgent({
    environment: JustBashEnvironment.create({
      directoryPath: directory,
      bashOptions: files ? { files } : undefined,
    }),
    environmentToolsDefinition: tools,
    model,
    prompt,
    system,
    directory: directory || '/home/user', // Default 'just-bash' working directory.
  });
};
