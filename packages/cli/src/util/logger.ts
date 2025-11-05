import { styleText } from 'node:util';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5,
}

type TextStyles = 'bold' | 'cyan' | 'green' | 'red' | 'yellowBright';

const createStyledText =
  (style: TextStyles) =>
  (text: string): string =>
    styleText(style, text);

const formatBold = createStyledText('bold');
const colorError = createStyledText('red');
const colorWarning = createStyledText('yellowBright');
const colorSuccess = createStyledText('green');
const colorDebug = createStyledText('cyan');

const formatLogMessage = (text: string, level: LogLevel): string => {
  switch (level) {
    case LogLevel.DEBUG:
      return colorDebug(text);
    case LogLevel.SUCCESS:
      return formatBold(colorSuccess(`✅ ${text}`));
    case LogLevel.WARN:
      return formatBold(colorWarning(`⚠️ ${text}`));
    case LogLevel.ERROR:
      return formatBold(colorError(`❌ ${text}`));
    default:
      return text;
  }
};

const DEFAULT_LOG_LEVEL = LogLevel.INFO;
const CURRENT_LOG_LEVEL =
  process.env['NODE_ENV'] === 'development' || process.env['DEBUG'] === 'true'
    ? LogLevel.DEBUG
    : process.env['SILENT'] === 'true'
      ? LogLevel.SILENT
      : DEFAULT_LOG_LEVEL;

/**
 * Logger class for logging messages with different severity levels.
 */
class Logger {
  /**
   * Logs a debug message.
   *
   * @param text - The message to log.
   */
  debug(text: string): void {
    this.log(text, LogLevel.DEBUG);
  }

  /**
   * Logs an info message.
   *
   * @param text - The message to log.
   */
  info(text: string): void {
    this.log(text, LogLevel.INFO);
  }

  /**
   * Logs a success message.
   *
   * @param text - The message to log.
   */
  success(text: string): void {
    this.log(text, LogLevel.SUCCESS);
  }

  /**
   * Logs a warning message.
   *
   * @param text - The message to log.
   */
  warn(text: string): void {
    this.log(text, LogLevel.WARN);
  }

  /**
   * Logs an error message.
   *
   * @param text - The message to log.
   */
  error(text: string): void {
    this.log(text, LogLevel.ERROR);
  }

  /**
   * Logs a message with a log level.
   *
   * @param text - The message to log.
   * @param level - The log level. Defaults to LogLevel.INFO.
   */
  private log(text: string, level: LogLevel = LogLevel.INFO): void {
    if (level < CURRENT_LOG_LEVEL) {
      return;
    }
    process.stderr.write(`${formatLogMessage(text, level)}\n`);
  }
}

/**
 * Default logger instance.
 */
export const logger = new Logger();
