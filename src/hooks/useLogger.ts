
import { useCallback } from "react";

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Toggle for production environment
const IS_PRODUCTION = import.meta.env.PROD;

// Configuration for logger
interface LoggerConfig {
  minLevel: LogLevel;
  includeTimestamp: boolean;
  disabled: boolean;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: IS_PRODUCTION ? 'info' : 'debug',
  includeTimestamp: true,
  disabled: false
};

// Log level priorities (higher number = higher priority)
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Custom logger hook that provides structured logging with context
 * @param context The context/component name for the logs
 * @param customConfig Optional custom configuration
 */
export const useLogger = (context: string, customConfig?: Partial<LoggerConfig>) => {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  
  const shouldLog = useCallback(
    (level: LogLevel) => {
      if (config.disabled) return false;
      return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.minLevel];
    },
    [config]
  );
  
  const formatMessage = useCallback(
    (level: LogLevel, message: string, ...args: any[]) => {
      const timestamp = config.includeTimestamp ? `${new Date().toISOString()} ` : '';
      return `${timestamp}${level}: [${context}] ${message}`;
    },
    [context, config]
  );
  
  const debug = useCallback(
    (message: string, ...args: any[]) => {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', message), ...args);
      }
    },
    [shouldLog, formatMessage]
  );
  
  const info = useCallback(
    (message: string, ...args: any[]) => {
      if (shouldLog('info')) {
        console.info(formatMessage('info', message), ...args);
      }
    },
    [shouldLog, formatMessage]
  );
  
  const warn = useCallback(
    (message: string, ...args: any[]) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message), ...args);
      }
    },
    [shouldLog, formatMessage]
  );
  
  const error = useCallback(
    (message: string, ...args: any[]) => {
      if (shouldLog('error')) {
        console.error(formatMessage('error', message), ...args);
      }
    },
    [shouldLog, formatMessage]
  );
  
  return {
    debug,
    info,
    warn,
    error
  };
};
