
import * as React from "react";
import { THEMES } from "../context/chart-context";
import type { ChartConfig } from "../context/chart-context";

interface ChartStyleProps {
  id: string;
  config: ChartConfig;
}

export const ChartStyle: React.FC<ChartStyleProps> = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  );

  console.debug(`[ChartStyle] Rendering for chart ID: ${id}, config entries: ${colorConfig.length}`);

  if (!colorConfig.length) {
    console.debug("[ChartStyle] No color config found, not rendering style element");
    return null;
  }

  const styleContent = Object.entries(THEMES)
    .map(
      ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join("\n")}
}
`
    )
    .join("\n");

  console.debug("[ChartStyle] Generated CSS variables for theming");
  
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: styleContent,
      }}
    />
  );
};

ChartStyle.displayName = "ChartStyle";
