
/**
 * Utility to show deprecation warnings in development
 * 
 * @param name Name of the deprecated item
 * @param message Deprecation message with migration instructions
 */
export const deprecationWarning = (name: string, message: string): void => {
  if (process.env.NODE_ENV === 'development') {
    const warning = `[DEPRECATED] ${name}: ${message}`;
    console.warn('%c' + warning, 'color: orange; font-weight: bold');
  }
};
