
import type { ChartConfig } from "../context/chart-context";

// Helper to extract item configuration from a payload
export function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  console.debug(`[getPayloadConfigFromPayload] Processing payload for key: ${key}`);
  
  if (typeof payload !== "object" || payload === null) {
    console.debug("[getPayloadConfigFromPayload] Invalid payload (not an object or null)");
    return undefined;
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
    console.debug(`[getPayloadConfigFromPayload] Using key from payload: ${configLabelKey}`);
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
    console.debug(`[getPayloadConfigFromPayload] Using key from nested payload: ${configLabelKey}`);
  }

  const result = configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
    
  console.debug(`[getPayloadConfigFromPayload] Found config: ${result ? 'yes' : 'no'}`);
  return result;
}
