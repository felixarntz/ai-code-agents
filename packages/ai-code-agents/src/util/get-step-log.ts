import type { StepResult, Tool } from 'ai';

/**
 * Returns a formatted log string for a given step result from an AI agent.
 *
 * @param stepResult - The step result to format.
 * @returns A formatted string representing the step log.
 */
export function getStepLog(
  stepResult: StepResult<NoInfer<Record<string, Tool>>>,
): string {
  const { content } = stepResult;

  let logEntry = '';
  content.forEach((part) => {
    logEntry += part.type;
    if ('toolName' in part && 'toolCallId' in part && part.toolCallId) {
      logEntry += ` (${part.toolName}, ID ${part.toolCallId})`;
    } else if ('toolName' in part) {
      logEntry += ` (${part.toolName})`;
    }
    logEntry += ': ';
    if (part.type === 'tool-call' && 'input' in part) {
      logEntry +=
        typeof part.input === 'string'
          ? part.input
          : JSON.stringify(part.input);
    } else if (part.type === 'tool-result' && 'output' in part) {
      logEntry +=
        typeof part.output === 'string'
          ? part.output
          : JSON.stringify(part.output);
    } else if (part.type === 'tool-error' && 'error' in part) {
      logEntry +=
        typeof part.error === 'object' &&
        part.error !== null &&
        'message' in part.error
          ? part.error.message
          : String(part.error);
    } else if (part.type === 'text' && 'text' in part) {
      logEntry += part.text;
    }
    logEntry += '\n';
  });

  return logEntry.trim();
}
