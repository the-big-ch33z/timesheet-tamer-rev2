
/**
 * TOIL Performance Monitoring Utility
 * 
 * This module provides tools to monitor and track performance of TOIL-related operations.
 * It helps identify bottlenecks and optimize event flow.
 */

import { createTimeLogger } from '../time/errors';

const logger = createTimeLogger('TOILPerformance');

// Performance metrics storage
interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// Store for active metrics
const activeMetrics = new Map<string, PerformanceMetric>();

// Store for completed metrics
const completedMetrics: PerformanceMetric[] = [];

// Max history size
const MAX_HISTORY = 100;

/**
 * Start timing an operation
 * @param name Name of the operation
 * @param metadata Additional context data
 * @returns Unique ID for the operation
 */
export function startTiming(name: string, metadata?: Record<string, any>): string {
  const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const metric: PerformanceMetric = {
    name,
    startTime: performance.now(),
    metadata
  };
  
  activeMetrics.set(id, metric);
  logger.debug(`[Performance] Started timing: ${name}`);
  
  return id;
}

/**
 * End timing an operation
 * @param id The operation ID from startTiming
 * @param additionalMetadata Any additional metadata to add
 * @returns The duration in milliseconds
 */
export function endTiming(id: string, additionalMetadata?: Record<string, any>): number | null {
  if (!activeMetrics.has(id)) {
    logger.warn(`[Performance] Cannot end timing for unknown ID: ${id}`);
    return null;
  }
  
  const metric = activeMetrics.get(id)!;
  metric.endTime = performance.now();
  metric.duration = metric.endTime - metric.startTime;
  
  if (additionalMetadata) {
    metric.metadata = {
      ...(metric.metadata || {}),
      ...additionalMetadata
    };
  }
  
  // Store completed metric
  completedMetrics.unshift(metric);
  
  // Trim history if needed
  if (completedMetrics.length > MAX_HISTORY) {
    completedMetrics.pop();
  }
  
  // Remove from active metrics
  activeMetrics.delete(id);
  
  // Log performance if slow
  if (metric.duration > 100) {
    logger.warn(`[Performance] Slow operation: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
  } else {
    logger.debug(`[Performance] ${metric.name} completed in ${metric.duration.toFixed(2)}ms`);
  }
  
  return metric.duration;
}

/**
 * Measure a function execution time
 * @param name Operation name
 * @param fn Function to measure
 * @param metadata Additional context
 * @returns The result of the function
 */
export function measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
  const id = startTiming(name, metadata);
  try {
    const result = fn();
    endTiming(id);
    return result;
  } catch (error) {
    endTiming(id, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Measure an async function execution time
 * @param name Operation name
 * @param fn Async function to measure
 * @param metadata Additional context
 * @returns Promise resolving to the function result
 */
export async function measureAsync<T>(
  name: string, 
  fn: () => Promise<T>, 
  metadata?: Record<string, any>
): Promise<T> {
  const id = startTiming(name, metadata);
  try {
    const result = await fn();
    endTiming(id);
    return result;
  } catch (error) {
    endTiming(id, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Get performance metrics history
 * @returns Copy of completed metrics
 */
export function getPerformanceHistory(): PerformanceMetric[] {
  return [...completedMetrics];
}

/**
 * Get active operations
 * @returns Copy of active metrics
 */
export function getActiveOperations(): PerformanceMetric[] {
  return Array.from(activeMetrics.values());
}

/**
 * Clear performance history
 */
export function clearPerformanceHistory(): void {
  completedMetrics.length = 0;
  logger.debug('[Performance] History cleared');
}

/**
 * Format metrics for display
 * @returns Formatted metrics string
 */
export function formatMetrics(): string {
  if (completedMetrics.length === 0) {
    return 'No performance metrics recorded';
  }
  
  const formatMetric = (m: PerformanceMetric) => 
    `${m.name}: ${m.duration?.toFixed(2) || '?'}ms`;
  
  const metrics = completedMetrics
    .map(formatMetric)
    .join('\n');
  
  return metrics;
}

/**
 * Add performance monitoring to EventBus for TOIL events
 * Call this function to automatically track event performance
 * @param eventBus The EventBus instance
 */
export function monitorTOILEvents(eventBus: any): () => void {
  if (!eventBus || typeof eventBus.subscribe !== 'function') {
    logger.error('[Performance] Invalid EventBus provided for monitoring');
    return () => {};
  }
  
  // Original publish function
  const originalPublish = eventBus.publish;
  
  // Override publish to measure performance
  eventBus.publish = function(eventType: string, data?: any, options?: any) {
    const id = startTiming(`EventBus.publish(${eventType})`, {
      eventType,
      dataType: data ? typeof data : 'undefined',
      hasUserId: data?.userId ? true : false,
      options
    });
    
    const result = originalPublish.call(this, eventType, data, options);
    
    endTiming(id);
    return result;
  };
  
  logger.debug('[Performance] EventBus monitoring enabled');
  
  // Return cleanup function
  return () => {
    eventBus.publish = originalPublish;
    logger.debug('[Performance] EventBus monitoring disabled');
  };
}

export default {
  startTiming,
  endTiming,
  measure,
  measureAsync,
  getPerformanceHistory,
  getActiveOperations,
  clearPerformanceHistory,
  formatMetrics,
  monitorTOILEvents
};
