import type { FilesystemEnvironmentBase } from './environments/filesystem-environment-base';
import {
  DockerEnvironment,
  DockerEnvironmentName,
} from './environments/docker-environment';
import {
  MockFilesystemEnvironment,
  MockFilesystemEnvironmentName,
} from './environments/mock-filesystem-environment';
import {
  NodeFilesystemEnvironment,
  NodeFilesystemEnvironmentName,
} from './environments/node-filesystem-environment';
import {
  UnsafeLocalEnvironment,
  UnsafeLocalEnvironmentName,
} from './environments/unsafe-local-environment';

const availableEnvironments = {
  [UnsafeLocalEnvironmentName]: UnsafeLocalEnvironment,
  [DockerEnvironmentName]: DockerEnvironment,
  [MockFilesystemEnvironmentName]: MockFilesystemEnvironment,
  [NodeFilesystemEnvironmentName]: NodeFilesystemEnvironment,
};

type EnvironmentClasses = {
  [UnsafeLocalEnvironmentName]: UnsafeLocalEnvironment;
  [DockerEnvironmentName]: DockerEnvironment;
  [MockFilesystemEnvironmentName]: MockFilesystemEnvironment;
  [NodeFilesystemEnvironmentName]: NodeFilesystemEnvironment;
};

type EnvironmentConfigOf<T> =
  T extends FilesystemEnvironmentBase<infer X> ? X : never;

export type EnvironmentName = keyof typeof availableEnvironments;
export const EnvironmentNames = Object.keys(
  availableEnvironments,
) as EnvironmentName[];

/**
 * Creates an environment instance based on the provided name and configuration.
 *
 * @param environmentName - The name identifying the type of environment to create.
 * @param config - The configuration object for the environment.
 * @returns An instance of the specified environment.
 */
export function createEnvironment<T extends EnvironmentName>(
  environmentName: T,
  config: EnvironmentConfigOf<EnvironmentClasses[T]>,
): EnvironmentClasses[T] {
  // Extra safe-guard - should not be needed.
  if (!(environmentName in availableEnvironments)) {
    throw new Error(`Unsupported environment: ${environmentName}`);
  }

  const EnvironmentClass = availableEnvironments[environmentName as T];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new EnvironmentClass(config as any) as EnvironmentClasses[T];
}
