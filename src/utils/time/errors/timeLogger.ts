
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface TimeLogger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

/**
 * Create a logger instance for time-related operations
 */
export const createTimeLogger = (context: string): TimeLogger => {
  const log = (level: LogLevel, message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    const contextMessage = `[${context}] ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(timestamp, contextMessage, ...args);
        break;
      case 'info':
        console.info(timestamp, contextMessage, ...args);
        break;
      case 'warn':
        console.warn(timestamp, contextMessage, ...args);
        break;
      case 'error':
        console.error(timestamp, contextMessage, ...args);
        break;
    }
  };
  
  return {
    debug: (message: string, ...args: any[]) => log('debug', message, ...args),
    info: (message: string, ...args: any[]) => log('info', message, ...args),
    warn: (message: string, ...args: any[]) => log('warn', message, ...args),
    error: (message: string, ...args: any[]) => log('error', message, ...args)
  };
};
