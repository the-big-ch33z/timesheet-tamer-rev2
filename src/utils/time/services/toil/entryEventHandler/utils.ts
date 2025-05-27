
import { format } from 'date-fns';

/**
 * Utility function to create standardized TOIL event data
 * This ensures all required properties are present in every event
 */
export function createStandardTOILEventData(entryId?: string, userId?: string) {
  const now = new Date();
  const monthYear = format(now, 'yyyy-MM');
  const dateStr = format(now, 'yyyy-MM-dd');
  
  return {
    entryId,
    userId,
    timestamp: Date.now(),
    date: dateStr,
    monthYear: monthYear,
    requiresRefresh: true,
    source: 'entryEventHandler',
    status: 'completed'
  };
}

/**
 * Comprehensive entry ID extraction from any event format
 * Updated to handle the standardized event format from unified service
 */
export function extractEntryId(event: any): string | null {
  console.log('[TOIL-EventHandler] Raw event received:', {
    type: typeof event,
    keys: Object.keys(event || {}),
    event: event
  });

  // Primary: Direct entryId property (standardized format)
  if (event?.entryId) {
    console.log('[TOIL-EventHandler] Found entryId directly:', event.entryId);
    return event.entryId;
  }

  // Secondary: DOM event detail format
  if (event?.detail?.entryId) {
    console.log('[TOIL-EventHandler] Found entryId in detail:', event.detail.entryId);
    return event.detail.entryId;
  }

  // Tertiary: Custom event payload format
  if (event?.payload?.entryId) {
    console.log('[TOIL-EventHandler] Found entryId in payload:', event.payload.entryId);
    return event.payload.entryId;
  }

  // Legacy formats for backward compatibility
  if (event?.entry?.id) {
    console.log('[TOIL-EventHandler] Found entryId in entry.id:', event.entry.id);
    return event.entry.id;
  }

  if (event?.id && typeof event.id === 'string') {
    console.log('[TOIL-EventHandler] Found entryId as direct id:', event.id);
    return event.id;
  }

  // Check if the whole event is just the entry ID string
  if (typeof event === 'string' && event.length > 0) {
    console.log('[TOIL-EventHandler] Event itself is entryId string:', event);
    return event;
  }

  console.warn('[TOIL-EventHandler] Could not extract entryId from event:', event);
  return null;
}

/**
 * Extract user ID from event (similar comprehensive approach)
 */
export function extractUserId(event: any): string | null {
  return event?.userId || 
         event?.detail?.userId || 
         event?.payload?.userId || 
         event?.entry?.userId ||
         event?.data?.userId ||
         event?.data?.entry?.userId ||
         event?.timeEntry?.userId ||
         event?.target?.userId ||
         null;
}
