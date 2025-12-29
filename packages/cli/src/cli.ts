#!/usr/bin/env node

import { program } from '@commander-js/extra-typings';
import { withOptions, withErrorHandling } from '@felixarntz/cli-utils';
import dotenv from 'dotenv';
import {
  name as dockerCodeAgentName,
  description as dockerCodeAgentDescription,
  handler as dockerCodeAgentHandler,
  options as dockerCodeAgentOptions,
} from './commands/docker-code-agent';
import {
  name as mockFilesystemCodeAgentName,
  description as mockFilesystemCodeAgentDescription,
  handler as mockFilesystemCodeAgentHandler,
  options as mockFilesystemCodeAgentOptions,
} from './commands/mock-filesystem-code-agent';
import {
  name as nodeFilesystemCodeAgentName,
  description as nodeFilesystemCodeAgentDescription,
  handler as nodeFilesystemCodeAgentHandler,
  options as nodeFilesystemCodeAgentOptions,
} from './commands/node-filesystem-code-agent';
import {
  name as unsafeLocalCodeAgentName,
  description as unsafeLocalCodeAgentDescription,
  handler as unsafeLocalCodeAgentHandler,
  options as unsafeLocalCodeAgentOptions,
} from './commands/unsafe-local-code-agent';

/**
 * Initializes the application.
 */
function initialize() {
  dotenv.config();

  withOptions(program.command(dockerCodeAgentName), dockerCodeAgentOptions)
    .description(dockerCodeAgentDescription)
    .action(withErrorHandling(dockerCodeAgentHandler));

  withOptions(
    program.command(mockFilesystemCodeAgentName),
    mockFilesystemCodeAgentOptions,
  )
    .description(mockFilesystemCodeAgentDescription)
    .action(withErrorHandling(mockFilesystemCodeAgentHandler));

  withOptions(
    program.command(nodeFilesystemCodeAgentName),
    nodeFilesystemCodeAgentOptions,
  )
    .description(nodeFilesystemCodeAgentDescription)
    .action(withErrorHandling(nodeFilesystemCodeAgentHandler));

  withOptions(
    program.command(unsafeLocalCodeAgentName),
    unsafeLocalCodeAgentOptions,
  )
    .description(unsafeLocalCodeAgentDescription)
    .action(withErrorHandling(unsafeLocalCodeAgentHandler));
}

/**
 * Runs the application.
 */
function run() {
  program.parse();
}

initialize();
run();
