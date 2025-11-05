#!/usr/bin/env node

import { program } from '@commander-js/extra-typings';
import dotenv from 'dotenv';
import { withOptions, withErrorHandling } from './util/commander';
import {
  name as codeAgentName,
  description as codeAgentDescription,
  handler as codeAgentHandler,
  options as codeAgentOptions,
} from './commands/code-agent';

/**
 * Initializes the application.
 */
function initialize() {
  dotenv.config();

  withOptions(program.command(codeAgentName), codeAgentOptions)
    .description(codeAgentDescription)
    .action(withErrorHandling(codeAgentHandler));
}

/**
 * Runs the application.
 */
function run() {
  program.parse();
}

initialize();
run();
