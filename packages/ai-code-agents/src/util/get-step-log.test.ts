import type { StepResult, Tool } from 'ai';
import { describe, it, expect } from 'vitest';
import { getStepLog } from './get-step-log';

const createStepResult = (
  overrides: Partial<StepResult<Record<string, Tool>>> = {},
): StepResult<NoInfer<Record<string, Tool>>> => ({
  content: [],
  text: '',
  reasoning: [],
  reasoningText: undefined,
  files: [],
  sources: [],
  toolCalls: [],
  toolResults: [],
  staticToolCalls: [],
  dynamicToolCalls: [],
  staticToolResults: [],
  dynamicToolResults: [],
  finishReason: 'stop',
  usage: {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    inputTokenDetails: {
      noCacheTokens: undefined,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
    },
    outputTokenDetails: {
      textTokens: undefined,
      reasoningTokens: undefined,
    },
  },
  warnings: undefined,
  request: {},
  response: {
    id: 'test-response',
    timestamp: new Date(),
    modelId: 'test-model',
    messages: [],
  },
  providerMetadata: undefined,
  ...overrides,
});

describe('getStepLog', () => {
  it('should return empty string for empty content array', () => {
    const stepResult = createStepResult();

    expect(getStepLog(stepResult)).toBe('');
  });

  it('should format text content part correctly', () => {
    const stepResult = createStepResult({
      content: [{ type: 'text', text: 'Hello world' }],
      text: 'Hello world',
    });

    expect(getStepLog(stepResult)).toBe('text: Hello world');
  });

  it('should format tool-call content part with string input', () => {
    const stepResult = createStepResult({
      content: [
        {
          type: 'tool-call',
          toolName: 'getWeather',
          toolCallId: 'call-123',
          input: 'San Francisco',
        },
      ],
      finishReason: 'tool-calls',
    });

    expect(getStepLog(stepResult)).toBe(
      'tool-call (getWeather, ID call-123): San Francisco',
    );
  });

  it('should format tool-call content part with object input', () => {
    const stepResult = createStepResult({
      content: [
        {
          type: 'tool-call',
          toolName: 'getWeather',
          toolCallId: 'call-456',
          input: { location: 'San Francisco', unit: 'F' },
        },
      ],
      finishReason: 'tool-calls',
    });

    expect(getStepLog(stepResult)).toBe(
      'tool-call (getWeather, ID call-456): {"location":"San Francisco","unit":"F"}',
    );
  });

  it('should format tool-call content part with only toolName', () => {
    const stepResult = createStepResult({
      content: [
        {
          type: 'tool-call',
          toolName: 'getWeather',
          toolCallId: '',
          input: 'San Francisco',
        },
      ],
      finishReason: 'tool-calls',
    });

    expect(getStepLog(stepResult)).toBe(
      'tool-call (getWeather): San Francisco',
    );
  });

  it('should format tool-result content part with string output', () => {
    const stepResult = createStepResult({
      content: [
        {
          type: 'tool-result',
          toolName: 'getWeather',
          toolCallId: 'call-123',
          input: 'San Francisco',
          output: 'Sunny, 72°F',
        },
      ],
    });

    expect(getStepLog(stepResult)).toBe(
      'tool-result (getWeather, ID call-123): Sunny, 72°F',
    );
  });

  it('should format tool-result content part with object output', () => {
    const stepResult = createStepResult({
      content: [
        {
          type: 'tool-result',
          toolName: 'getWeather',
          toolCallId: 'call-789',
          input: { location: 'San Francisco' },
          output: { temperature: 72, condition: 'sunny', unit: 'F' },
        },
      ],
    });

    expect(getStepLog(stepResult)).toBe(
      'tool-result (getWeather, ID call-789): {"temperature":72,"condition":"sunny","unit":"F"}',
    );
  });

  it('should format tool-error content part with string error', () => {
    const stepResult = createStepResult({
      content: [
        {
          type: 'tool-error',
          toolName: 'getWeather',
          toolCallId: 'call-123',
          input: 'San Francisco',
          error: 'Network timeout',
        },
      ],
      finishReason: 'error',
    });

    expect(getStepLog(stepResult)).toBe(
      'tool-error (getWeather, ID call-123): Network timeout',
    );
  });

  it('should format tool-error content part with error object having message', () => {
    const stepResult = createStepResult({
      content: [
        {
          type: 'tool-error',
          toolName: 'getWeather',
          toolCallId: 'call-456',
          input: { location: 'San Francisco' },
          error: { message: 'Invalid API key', code: 401 },
        },
      ],
      finishReason: 'error',
    });

    expect(getStepLog(stepResult)).toBe(
      'tool-error (getWeather, ID call-456): Invalid API key',
    );
  });

  it('should format tool-error content part with error object without message', () => {
    const stepResult = createStepResult({
      content: [
        {
          type: 'tool-error',
          toolName: 'getWeather',
          toolCallId: 'call-789',
          input: 'San Francisco',
          error: { code: 500, details: 'Server error' },
        },
      ],
      finishReason: 'error',
    });

    expect(getStepLog(stepResult)).toBe(
      'tool-error (getWeather, ID call-789): [object Object]',
    );
  });

  it('should format multiple content parts correctly', () => {
    const stepResult = createStepResult({
      content: [
        { type: 'text', text: 'Let me check the weather.' },
        {
          type: 'tool-call',
          toolName: 'getWeather',
          toolCallId: 'call-123',
          input: { location: 'San Francisco' },
        },
        {
          type: 'tool-result',
          toolName: 'getWeather',
          toolCallId: 'call-123',
          input: { location: 'San Francisco' },
          output: { temperature: 72, condition: 'sunny' },
        },
        { type: 'text', text: 'The weather is sunny with 72°F.' },
      ],
      text: 'Let me check the weather. The weather is sunny with 72°F.',
    });

    const expected = [
      'text: Let me check the weather.',
      'tool-call (getWeather, ID call-123): {"location":"San Francisco"}',
      'tool-result (getWeather, ID call-123): {"temperature":72,"condition":"sunny"}',
      'text: The weather is sunny with 72°F.',
    ].join('\n');

    expect(getStepLog(stepResult)).toBe(expected);
  });

  it('should handle empty text content', () => {
    const stepResult = createStepResult({
      content: [{ type: 'text', text: '' }],
    });

    expect(getStepLog(stepResult)).toBe('text:');
  });

  it('should handle null input/output/error values', () => {
    const stepResult = createStepResult({
      content: [
        {
          type: 'tool-call',
          toolName: 'testTool',
          toolCallId: 'call-null',
          input: null,
        },
        {
          type: 'tool-result',
          toolName: 'testTool',
          toolCallId: 'call-null',
          input: null,
          output: null,
        },
        {
          type: 'tool-error',
          toolName: 'testTool',
          toolCallId: 'call-null',
          input: null,
          error: null,
        },
      ],
      finishReason: 'error',
    });

    const expected = [
      'tool-call (testTool, ID call-null): null',
      'tool-result (testTool, ID call-null): null',
      'tool-error (testTool, ID call-null): null',
    ].join('\n');

    expect(getStepLog(stepResult)).toBe(expected);
  });
});
