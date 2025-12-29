import { type EnvironmentName } from 'ai-code-agents';

/**
 * Creates configuration for an environment based on the environment type and parameters.
 *
 * @param environment - The type of environment to configure
 * @param directory - The directory path for the environment to work on
 * @param environmentId - Optional ID for the environment (used for Docker containers)
 * @returns Environment configuration object
 */
export const createEnvironmentConfig = (
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
