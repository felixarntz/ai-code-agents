import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCodeAgent,
  type Environment,
  type ToolsDefinition,
} from 'ai-code-agents';
import { output, logger } from '@felixarntz/cli-utils';
import { createAndRunCodeAgent } from './create-and-run-code-agent';

vi.mock('ai-code-agents', async () => {
  const actual = await vi.importActual('ai-code-agents');
  return {
    ...actual,
    createCodeAgent: vi.fn(),
  };
});

vi.mock('@felixarntz/cli-utils', async () => {
  const actual = await vi.importActual('@felixarntz/cli-utils');
  return {
    ...actual,
    output: vi.fn(),
    logger: {
      debug: vi.fn(),
    },
  };
});

interface MockAgent {
  generate: ReturnType<typeof vi.fn>;
}

describe('createAndRunCodeAgent', () => {
  const mockEnvironment = {
    name: 'mock-env',
    readFile: vi.fn(),
    writeFile: vi.fn(),
    deleteFile: vi.fn(),
    moveFile: vi.fn(),
    copyFile: vi.fn(),
  } as unknown as Environment;

  const defaultOptions = {
    environment: mockEnvironment,
    environmentToolsDefinition: 'readonly' as const,
    model: 'test-model',
    prompt: 'Test prompt',
    directory: '/test/directory',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(logger.debug).mockImplementation((message: string) => {
      // Default implementation - just log normally
      console.debug(message);
    });
    vi.mocked(output).mockImplementation((text: string) => {
      // Default implementation - just output normally
      console.log(text);
    });
  });

  describe('happy path', () => {
    it('creates and runs a code agent with minimal options', async () => {
      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Agent response',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      await createAndRunCodeAgent(defaultOptions);

      expect(createCodeAgent).toHaveBeenCalledWith({
        model: 'test-model',
        environment: mockEnvironment,
        environmentToolsDefinition: 'readonly',
        maxSteps: 10,
        instructions: undefined,
        logStep: expect.any(Function),
      });

      expect(mockAgent.generate).toHaveBeenCalledWith({
        prompt: 'Test prompt',
      });

      expect(output).toHaveBeenCalledWith('Agent response');
    });

    it('creates and runs a code agent with system instruction', async () => {
      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Response with system instruction',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      const options = {
        ...defaultOptions,
        system: 'Be concise',
      };

      await createAndRunCodeAgent(options);

      expect(createCodeAgent).toHaveBeenCalledWith({
        model: 'test-model',
        environment: mockEnvironment,
        environmentToolsDefinition: 'readonly',
        maxSteps: 10,
        instructions: 'Be concise',
        logStep: expect.any(Function),
      });
    });

    it('creates and runs a code agent with custom maxSteps', async () => {
      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Response',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      const options = {
        ...defaultOptions,
        maxSteps: 20,
      };

      await createAndRunCodeAgent(options);

      expect(createCodeAgent).toHaveBeenCalledWith({
        model: 'test-model',
        environment: mockEnvironment,
        environmentToolsDefinition: 'readonly',
        maxSteps: 20,
        instructions: undefined,
        logStep: expect.any(Function),
      });
    });

    it('outputs the result text from agent.generate', async () => {
      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Final agent response',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      await createAndRunCodeAgent(defaultOptions);

      expect(output).toHaveBeenCalledWith('Final agent response');
    });
  });

  describe('logging', () => {
    it('logs initial debug message with environment name, directory, and model', async () => {
      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Response',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      await createAndRunCodeAgent(defaultOptions);

      expect(logger.debug).toHaveBeenCalledWith(
        'Running task prompt in mock-env about code in /test/directory (using model test-model)...',
      );
    });

    it('logs initial debug message without model suffix when model is empty', async () => {
      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Response',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      const options = {
        ...defaultOptions,
        model: '',
      };

      await createAndRunCodeAgent(options);

      expect(logger.debug).toHaveBeenCalledWith(
        'Running task prompt in mock-env about code in /test/directory...',
      );
    });

    it('calls logStep callback with step log message', async () => {
      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Response',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      await createAndRunCodeAgent(defaultOptions);

      const createCodeAgentCall = vi.mocked(createCodeAgent).mock.calls[0];
      const logStepCallback = createCodeAgentCall[0].logStep as (
        log: string,
      ) => void;

      expect(logStepCallback).toBeDefined();

      logStepCallback('Step 1: Reading file');

      expect(logger.debug).toHaveBeenCalledWith('\nStep 1: Reading file');
    });
  });

  describe('edge cases', () => {
    it('handles environment with different names', async () => {
      const customEnv = {
        ...mockEnvironment,
        name: 'docker',
      };

      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Response',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      const options = {
        ...defaultOptions,
        environment: customEnv as unknown as Environment,
      };

      await createAndRunCodeAgent(options);

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Running task prompt in docker'),
      );
    });

    it('handles different ToolsDefinition values', async () => {
      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Response',
        }),
      };

      const toolsDefinitions: ToolsDefinition[] = ['readonly', 'basic', 'all'];

      for (const toolsDef of toolsDefinitions) {
        vi.clearAllMocks();
        vi.mocked(createCodeAgent).mockReturnValue(
          mockAgent as unknown as ReturnType<typeof createCodeAgent>,
        );

        const options = {
          ...defaultOptions,
          environmentToolsDefinition: toolsDef,
        };

        await createAndRunCodeAgent(options);

        expect(createCodeAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            environmentToolsDefinition: toolsDef,
          }),
        );
      }
    });

    it('handles response with empty text', async () => {
      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: '',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      await createAndRunCodeAgent(defaultOptions);

      expect(output).toHaveBeenCalledWith('');
    });

    it('handles response with multiline text', async () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: multilineText,
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      await createAndRunCodeAgent(defaultOptions);

      expect(output).toHaveBeenCalledWith(multilineText);
    });
  });

  describe('error handling', () => {
    it('propagates agent.generate errors', async () => {
      const error = new Error('Agent execution failed');
      const mockAgent: MockAgent = {
        generate: vi.fn().mockRejectedValue(error),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      await expect(createAndRunCodeAgent(defaultOptions)).rejects.toThrow(
        'Agent execution failed',
      );
    });

    it('propagates output errors', async () => {
      const error = new Error('Output failed');
      vi.mocked(output).mockImplementation(() => {
        throw error;
      });

      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Response',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      await expect(createAndRunCodeAgent(defaultOptions)).rejects.toThrow(
        'Output failed',
      );
    });

    it('propagates logger.debug errors', async () => {
      const error = new Error('Logging failed');
      vi.mocked(logger.debug).mockImplementation(() => {
        throw error;
      });

      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Response',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      await expect(createAndRunCodeAgent(defaultOptions)).rejects.toThrow(
        'Logging failed',
      );
    });
  });

  describe('integration', () => {
    it('completes full workflow with all parameters', async () => {
      const mockAgent: MockAgent = {
        generate: vi.fn().mockResolvedValue({
          text: 'Complete workflow response',
        }),
      };

      vi.mocked(createCodeAgent).mockReturnValue(
        mockAgent as unknown as ReturnType<typeof createCodeAgent>,
      );

      const options = {
        environment: mockEnvironment,
        environmentToolsDefinition: 'basic' as const,
        model: 'gpt-4',
        prompt: 'Implement a feature',
        system: 'You are a code assistant',
        directory: '/home/user/project',
        maxSteps: 15,
      };

      await createAndRunCodeAgent(options);

      expect(logger.debug).toHaveBeenCalledWith(
        'Running task prompt in mock-env about code in /home/user/project (using model gpt-4)...',
      );

      expect(createCodeAgent).toHaveBeenCalledWith({
        model: 'gpt-4',
        environment: mockEnvironment,
        environmentToolsDefinition: 'basic',
        maxSteps: 15,
        instructions: 'You are a code assistant',
        logStep: expect.any(Function),
      });

      expect(mockAgent.generate).toHaveBeenCalledWith({
        prompt: 'Implement a feature',
      });

      expect(output).toHaveBeenCalledWith('Complete workflow response');
    });
  });
});
