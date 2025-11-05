import type {
  CommandUnknownOpts,
  OptionValues,
} from '@commander-js/extra-typings';
import { logger } from './logger';

export type HandlerArgs = [...unknown[], OptionValues, CommandUnknownOpts];

export type Handler = (...handlerArgs: HandlerArgs) => void | Promise<void>;

export type OptionsInput = Record<string, string | boolean>;

export const getArgs = (handlerArgs: HandlerArgs): string[] => {
  if (handlerArgs.length <= 2) {
    return [];
  }
  return handlerArgs.slice(0, -2).map(String);
};

export const getVariadicArgs = (
  handlerArgs: HandlerArgs,
  index: number,
): string[] => {
  if (handlerArgs.length <= index) {
    return [];
  }
  return handlerArgs[index] as string[];
};

export const getOpt = (handlerArgs: HandlerArgs): OptionsInput => {
  if (handlerArgs.length <= 1) {
    return {};
  }
  return handlerArgs[handlerArgs.length - 2] as OptionsInput;
};

export type Option = {
  description: string;
  argname: string;
  positional?: boolean;
  required?: boolean;
  defaults?: string;
  choices?: string[];
  parse?: (value: string) => string;
  variadic?: boolean; // For now, only supported for positional arguments.
};

export const withOptions = (
  command: CommandUnknownOpts,
  options: Option[],
): CommandUnknownOpts => {
  options.forEach(
    ({
      description,
      argname,
      positional,
      required,
      defaults,
      choices,
      parse,
      variadic,
    }) => {
      if (positional) {
        const variadicSuffix = variadic ? '...' : '';
        const argument = command.createArgument(
          required
            ? `<${argname}${variadicSuffix}>`
            : `[${argname}${variadicSuffix}]`,
          description,
        );
        if (defaults) {
          argument.default(defaults);
        }
        if (typeof parse === 'function') {
          argument.argParser(parse);
        }
        if (choices) {
          argument.choices(choices);
        }
        command.addArgument(argument);
        return;
      }

      const option = command.createOption(argname, description);
      if (required) {
        option.makeOptionMandatory(true);
      }
      if (defaults) {
        option.default(defaults);
      }
      if (typeof parse === 'function') {
        option.argParser(parse);
      }
      if (choices) {
        option.choices(choices);
      }
      command.addOption(option);
    },
  );
  return command;
};

export const withErrorHandling =
  (handler: Handler): Handler =>
  async (...handlerArgs: [...unknown[], OptionValues, CommandUnknownOpts]) => {
    try {
      const result = handler(...handlerArgs);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
      process.exitCode = 1;
    }
  };
