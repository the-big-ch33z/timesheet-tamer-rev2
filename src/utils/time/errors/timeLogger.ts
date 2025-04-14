
/**
 * Time logger utility
 * Provides consistent logging functionality for time-related operations
 */

// Log levels for flexibility
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Default minimum log level based on environment
const DEFAULT_MIN_LEVEL: LogLevel = import.meta.env.PROD ? 'warn' : 'debug';

// Log level priorities (higher number = higher priority)
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

interface TimeLoggerOptions {
  minLevel?: LogLevel;
  disabled?: boolean;
  includeTimestamp?: boolean;
}

/**
 * Creates a logger instance with a specific context
 * @param context The context/component name for the logs
 * @param options Optional configuration options
 */
export const createTimeLogger = (context: string, options?: TimeLoggerOptions) => {
  const config = {
    minLevel: options?.minLevel || DEFAULT_MIN_LEVEL,
    disabled: options?.disabled || false,
    includeTimestamp: options?.includeTimestamp !== false
  };
  
  // Check if this log level should be logged based on priority
  const shouldLog = (level: LogLevel): boolean => {
    if (config.disabled) return false;
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.minLevel];
  };
  
  // Format a log message with timestamp and context
  const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = config.includeTimestamp ? `${new Date().toISOString()} ` : '';
    return `${timestamp}${level}: [${context}] ${message}`;
  };
  
  return {
    debug: (message: string, ...args: any[]): void => {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', message), ...args);
      }
    },
    
    info: (message: string, ...args: any[]): void => {
      if (shouldLog('info')) {
        console.info(formatMessage('info', message), ...args);
      }
    },
    
    warn: (message: string, ...args: any[]): void => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message), ...args);
      }
    },
    
    error: (message: string, ...args: any[]): void => {
      if (shouldLog('error')) {
        console.error(formatMessage('error', message), ...args);
      }
    }
  };
};
