import { describe, it, expect } from 'vitest';
import { createEnvironment } from './environment-creators';
import { MockFilesystemEnvironment } from './environments/mock-filesystem-environment';
import { DockerEnvironment } from './environments/docker-environment';
import { NodeFilesystemEnvironment } from './environments/node-filesystem-environment';
import { UnsafeLocalEnvironment } from './environments/unsafe-local-environment';

describe('createEnvironment', () => {
  describe('MockFilesystemEnvironment', () => {
    it('should create a MockFilesystemEnvironment with default config', () => {
      const env = createEnvironment('mock-filesystem', {});
      expect(env).toBeInstanceOf(MockFilesystemEnvironment);
      expect(env.name).toBe('mock-filesystem');
    });

    it('should create a MockFilesystemEnvironment with initialFiles', () => {
      const initialFiles = new Map([['test.txt', 'content']]);
      const env = createEnvironment('mock-filesystem', { initialFiles });
      expect(env).toBeInstanceOf(MockFilesystemEnvironment);
      expect(env.name).toBe('mock-filesystem');
    });

    it('should create a MockFilesystemEnvironment with directoryPath', () => {
      const env = createEnvironment('mock-filesystem', {
        directoryPath: '/test',
      });
      expect(env).toBeInstanceOf(MockFilesystemEnvironment);
      expect(env.name).toBe('mock-filesystem');
    });

    it('should create a MockFilesystemEnvironment with full config', () => {
      const initialFiles = new Map([['test.txt', 'content']]);
      const env = createEnvironment('mock-filesystem', {
        initialFiles,
        directoryPath: '/test',
      });
      expect(env).toBeInstanceOf(MockFilesystemEnvironment);
      expect(env.name).toBe('mock-filesystem');
    });
  });

  describe('DockerEnvironment', () => {
    it('should create a DockerEnvironment with required containerId', () => {
      const env = createEnvironment('docker', {
        containerId: 'test-container',
      });
      expect(env).toBeInstanceOf(DockerEnvironment);
      expect(env.name).toBe('docker');
    });

    it('should create a DockerEnvironment with containerId and directoryPath', () => {
      const env = createEnvironment('docker', {
        containerId: 'test-container',
        directoryPath: '/app',
      });
      expect(env).toBeInstanceOf(DockerEnvironment);
      expect(env.name).toBe('docker');
    });
  });

  describe('NodeFilesystemEnvironment', () => {
    it('should create a NodeFilesystemEnvironment with directoryPath', () => {
      const env = createEnvironment('node-filesystem', {
        directoryPath: '/tmp/test',
      });
      expect(env).toBeInstanceOf(NodeFilesystemEnvironment);
      expect(env.name).toBe('node-filesystem');
    });
  });

  describe('UnsafeLocalEnvironment', () => {
    it('should create an UnsafeLocalEnvironment with absolute directoryPath', () => {
      const env = createEnvironment('unsafe-local', {
        directoryPath: '/tmp/test',
      });
      expect(env).toBeInstanceOf(UnsafeLocalEnvironment);
      expect(env.name).toBe('unsafe-local');
    });
  });

  describe('error handling', () => {
    it('should throw an error for unsupported environment name', () => {
      expect(() =>
        createEnvironment('unsupported' as unknown as 'mock-filesystem', {}),
      ).toThrow('Unsupported environment: unsupported');
    });
  });
});
