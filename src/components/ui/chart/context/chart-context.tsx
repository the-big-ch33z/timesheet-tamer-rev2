
import * as React from "react";

// Theme configuration for light/dark mode
export const THEMES = { light: "", dark: ".dark" } as const;

// Define chart configuration type
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

// Chart context type definition
type ChartContextProps = {
  config: ChartConfig;
};

// Create and export the chart context
const ChartContext = React.createContext<ChartContextProps | null>(null);

// Hook for accessing chart context
export function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    console.error("useChart must be used within a <ChartContainer />");
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

export { ChartContext };
