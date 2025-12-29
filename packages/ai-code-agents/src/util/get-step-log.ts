import type { StepResult, Tool } from 'ai';
import { truncateObject, truncateString } from './truncate';

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
          ? truncateString(part.input)
          : part.input === null || part.input === undefined
            ? String(part.input)
            : JSON.stringify(
                truncateObject(part.input as Record<string, unknown>),
              );
    } else if (part.type === 'tool-result' && 'output' in part) {
      logEntry +=
        typeof part.output === 'string'
          ? truncateString(part.output)
          : part.output === null || part.output === undefined
            ? String(part.output)
            : JSON.stringify(
                truncateObject(part.output as Record<string, unknown>),
              );
    } else if (part.type === 'tool-error' && 'error' in part) {
      logEntry +=
        typeof part.error === 'object' &&
        part.error !== null &&
        'message' in part.error
          ? (part.error.message as string)
          : String(part.error);
    } else if (part.type === 'text' && 'text' in part) {
      logEntry += truncateString(part.text);
    }
    logEntry += '\n';
  });

  return logEntry.trim();
}
