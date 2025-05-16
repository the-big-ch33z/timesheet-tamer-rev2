
import { TOILSummary } from "@/types/toil";

/**
 * Event types for TOIL operations
 */
export type TOILEventType = 
  | 'toil-calculated' 
  | 'toil-updated'
  | 'toil-consumed'
  | 'toil-error';

/**
 * Interface for TOIL events
 */
export interface TOILEvent {
  type: TOILEventType;
  data: any;
  timestamp: Date;
  userId?: string;
}

/**
 * Context for TOIL events
 */
export interface TOILEventContextType {
  dispatchTOILEvent: (event: Omit<TOILEvent, 'timestamp'>) => void;
  subscribe: (eventType: TOILEventType | 'all', callback: (event: TOILEvent) => void) => () => void;
  lastEvent: TOILEvent | null;
}

/**
 * Callbacks for the TOIL update handler
 */
export interface TOILUpdateHandlerCallbacks {
  onValidUpdate?: (data: TOILSummary) => void;
  onRefresh?: () => void;
  onLog?: (message: string, data?: any) => void;
}
