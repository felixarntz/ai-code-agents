import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SubmitTool } from './submit-tool';

describe('SubmitTool', () => {
  it('should have the correct metadata', () => {
    const tool = new SubmitTool();

    expect(tool.name).toBe('submit');
    expect(tool.description).toBe(
      'Submits the current task, indicating that it is completed.',
    );
    expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.outputSchema).toBeInstanceOf(z.ZodObject);
    expect(tool.needsApproval).toBe(false);
  });

  it('should return an empty object on execute', async () => {
    const tool = new SubmitTool();
    const result = await tool.execute({} as never, {} as never);
    expect(result).toEqual({});
  });

  it('should return the correct model output', () => {
    const tool = new SubmitTool();
    const modelOutput = tool.toModelOutput({});
    expect(modelOutput).toEqual({
      type: 'text',
      value: 'Task submitted successfully.',
    });
  });

  it('should have no examples', () => {
    const tool = new SubmitTool();
    expect(tool.examples).toEqual([]);
  });
});
