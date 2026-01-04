import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import type {
  ToolInterface,
  ToolExample,
} from '@ai-code-agents/environment-utils';
import {
  getAdditionalInstructions,
  formatExampleForInstructions,
  getCodeAgentConstraints,
  getCodeAgentFinalReminder,
} from './instructions';

describe('getAdditionalInstructions', () => {
  const mockToolWithExamples: ToolInterface<unknown, unknown> = {
    name: 'test_tool',
    description: 'A test tool',
    inputSchema: z.object({}),
    outputSchema: z.object({}),
    execute: vi.fn(),
    toModelOutput: vi.fn(),
    inputExamples: [
      {
        input: { param: 'value' },
      },
      {
        input: 'string input',
      },
    ],
    examples: [
      {
        input: { param: 'value' },
        output: 'success',
      },
      {
        input: 'string input',
        output: { result: 'object output' },
      },
    ],
    needsApproval: false,
  };

  const mockToolWithoutExamples: ToolInterface<unknown, unknown> = {
    name: 'empty_tool',
    description: 'A tool without examples',
    inputSchema: z.object({}),
    outputSchema: z.object({}),
    execute: vi.fn(),
    toModelOutput: vi.fn(),
    inputExamples: [],
    examples: [],
    needsApproval: false,
  };

  it('should generate instructions with allowSubmit true and tools with examples', () => {
    const config = {
      maxSteps: 10,
      allowSubmit: true,
      tools: {
        test_tool: mockToolWithExamples,
      },
    };

    const result = getAdditionalInstructions(config);

    expect(result).toContain('# Tool Examples');
    expect(result).toContain('## Tool: `test_tool`');
    expect(result).toContain('<example>');
    expect(result).toContain('<tool_call>');
    expect(result).toContain('<tool_response>');
    expect(result).toContain('# Behavioral Guidelines');
    expect(result).toContain('## You MUST:');
    expect(result).toContain('Complete your task within 10 steps');
    expect(result).toContain(getCodeAgentFinalReminder());
    // Should have 3 must constraints (always issue tools, submit tool, complete within steps)
    expect(result.split('## You MUST:')[1].split('\n- ')[1]).toBeDefined();
    expect(
      result.split('## You MUST:')[1].split('\n- ').length,
    ).toBeGreaterThanOrEqual(4); // header + 3 items
  });

  it('should generate instructions with allowSubmit false and tools without examples', () => {
    const config = {
      maxSteps: 5,
      allowSubmit: false,
      tools: {
        empty_tool: mockToolWithoutExamples,
      },
    };

    const result = getAdditionalInstructions(config);

    expect(result).toContain('# Tool Examples');
    expect(result).not.toContain('## Tool: `empty_tool`'); // No examples to show
    expect(result).toContain('# Behavioral Guidelines');
    expect(result).toContain('## You MUST:');
    expect(result).toContain('Complete your task within 5 steps');
    expect(result).toContain(getCodeAgentFinalReminder());
    // Should have 2 must constraints (always issue tools, complete within steps) - no submit
    expect(result.split('## You MUST:')[1].split('\n- ').length).toBe(4); // header + 2 items + empty
  });

  it('should handle empty tools object', () => {
    const config = {
      maxSteps: 3,
      allowSubmit: true,
      tools: {},
    };

    const result = getAdditionalInstructions(config);

    expect(result).toContain('# Tool Examples');
    expect(result).toContain('# Behavioral Guidelines');
    expect(result).toContain('Complete your task within 3 steps');
    expect(result).toContain(getCodeAgentFinalReminder());
    // Should have 3 must constraints (always issue tools, submit tool, complete within steps)
    expect(
      result.split('## You MUST:')[1].split('\n- ').length,
    ).toBeGreaterThanOrEqual(4); // header + 3 items
  });

  it('should include multiple tool examples correctly formatted', () => {
    const config = {
      maxSteps: 8,
      allowSubmit: false,
      tools: {
        test_tool: mockToolWithExamples,
      },
    };

    const result = getAdditionalInstructions(config);

    expect(result).toContain('test_tool({\n  "param": "value"\n})');
    expect(result).toContain('<tool_response>\n"success"\n</tool_response>');
    expect(result).toContain('test_tool("string input")');
    expect(result).toContain(
      '<tool_response>\n{\n  "result": "object output"\n}\n</tool_response>',
    );
  });
});

describe('formatExampleForInstructions', () => {
  it('should format example with string input and output', () => {
    const example: ToolExample<string, string> = {
      input: 'test input',
      output: 'test output',
    };

    const result = formatExampleForInstructions('test_tool', example);

    expect(result).toBe(`<example>
<tool_call>
test_tool("test input")
</tool_call>
<tool_response>
"test output"
</tool_response>
</example>`);
  });

  it('should format example with number input and output', () => {
    const example: ToolExample<number, number> = {
      input: 42,
      output: 84,
    };

    const result = formatExampleForInstructions('calc_tool', example);

    expect(result).toBe(`<example>
<tool_call>
calc_tool(42)
</tool_call>
<tool_response>
84
</tool_response>
</example>`);
  });

  it('should format example with object input and output', () => {
    const example: ToolExample<{ param: string }, { result: string }> = {
      input: { param: 'value' },
      output: { result: 'success' },
    };

    const result = formatExampleForInstructions('object_tool', example);

    expect(result).toBe(`<example>
<tool_call>
object_tool({
  "param": "value"
})
</tool_call>
<tool_response>
{
  "result": "success"
}
</tool_response>
</example>`);
  });

  it('should format example with undefined output', () => {
    const example: ToolExample<string, string | undefined> = {
      input: 'input only',
      output: undefined,
    };

    const result = formatExampleForInstructions('no_output_tool', example);

    expect(result).toBe(`<example>
<tool_call>
no_output_tool("input only")
</tool_call>
</example>`);
  });

  it('should handle complex nested objects', () => {
    const example: ToolExample<unknown, unknown> = {
      input: {
        nested: {
          array: [1, 2, { deep: 'value' }],
          number: 123,
        },
      },
      output: {
        status: 'ok',
        data: {
          items: ['a', 'b', 'c'],
        },
      },
    };

    const result = formatExampleForInstructions('complex_tool', example);

    expect(result).toContain('<tool_call>');
    expect(result).toContain('complex_tool(');
    expect(result).toContain(
      '{\n  "nested": {\n    "array": [\n      1,\n      2,\n      {\n        "deep": "value"\n      }\n    ],\n    "number": 123\n  }\n}',
    );
    expect(result).toContain('<tool_response>');
    expect(result).toContain(
      '{\n  "status": "ok",\n  "data": {\n    "items": [\n      "a",\n      "b",\n      "c"\n    ]\n  }\n}',
    );
  });

  it('should handle empty string input and output', () => {
    const example: ToolExample<string, string> = {
      input: '',
      output: '',
    };

    const result = formatExampleForInstructions('empty_tool', example);

    expect(result).toBe(`<example>
<tool_call>
empty_tool("")
</tool_call>
<tool_response>
""
</tool_response>
</example>`);
  });
});

describe('getCodeAgentConstraints', () => {
  it('should return constraints with allowSubmit true', () => {
    const config = {
      maxSteps: 15,
      allowSubmit: true,
    };

    const result = getCodeAgentConstraints(config);

    expect(result.must).toEqual([
      'Always issue tool calls to complete your task',
      'Call the `submit` tool once you think you have completed your task, to submit your results',
      'Complete your task within 15 steps',
    ]);
    expect(result.must_not).toEqual(['Engage with the user directly']);
    expect(result.should).toBeUndefined();
    expect(result.should_not).toBeUndefined();
  });

  it('should return constraints with allowSubmit false', () => {
    const config = {
      maxSteps: 7,
      allowSubmit: false,
    };

    const result = getCodeAgentConstraints(config);

    expect(result.must).toEqual([
      'Always issue tool calls to complete your task',
      'Complete your task within 7 steps',
    ]);
    expect(result.must_not).toEqual(['Engage with the user directly']);
    expect(result.should).toBeUndefined();
    expect(result.should_not).toBeUndefined();
  });

  it('should handle different maxSteps values', () => {
    const config = {
      maxSteps: 1,
      allowSubmit: false,
    };

    const result = getCodeAgentConstraints(config);

    expect(result.must).toContain('Complete your task within 1 steps');
  });

  it('should handle maxSteps zero', () => {
    const config = {
      maxSteps: 0,
      allowSubmit: true,
    };

    const result = getCodeAgentConstraints(config);

    expect(result.must).toContain('Complete your task within 0 steps');
  });
});
