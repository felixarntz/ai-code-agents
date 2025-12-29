import { describe, it, expect } from 'vitest';
import { createEnvironmentConfig } from './create-environment-config';

describe('createEnvironmentConfig', () => {
  it('creates config with directoryPath for any environment without environmentId', () => {
    const result = createEnvironmentConfig('node', '/path/to/project');
    expect(result).toEqual({
      directoryPath: '/path/to/project',
    });
  });

  it('creates config with directoryPath for docker environment without containerId', () => {
    const result = createEnvironmentConfig('docker', '/path/to/project');
    expect(result).toEqual({
      directoryPath: '/path/to/project',
    });
  });

  it('adds containerId for docker environment when environmentId is provided', () => {
    const result = createEnvironmentConfig(
      'docker',
      '/path/to/project',
      'container123',
    );
    expect(result).toEqual({
      directoryPath: '/path/to/project',
      containerId: 'container123',
    });
  });

  it('ignores environmentId for non-docker environments', () => {
    const result = createEnvironmentConfig(
      'node',
      '/path/to/project',
      'should-be-ignored',
    );
    expect(result).toEqual({
      directoryPath: '/path/to/project',
    });
  });
});
