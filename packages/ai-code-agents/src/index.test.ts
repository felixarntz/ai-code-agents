import { describe, it, expect } from 'vitest';
import { Greeting } from './index';

describe('test', () => {
  it('should export Greeting', () => {
    expect(Greeting).toBe('Hello from ai-code-agents package!');
  });
});
