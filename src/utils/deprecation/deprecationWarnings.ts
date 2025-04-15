
const warned = new Set<string>();

export const deprecationWarning = (componentName: string, message: string) => {
  const key = `${componentName}-${message}`;
  
  if (!warned.has(key)) {
    console.warn(`[Deprecation][${componentName}] ${message}`);
    warned.add(key);
  }
};
