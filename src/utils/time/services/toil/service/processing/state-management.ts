
import { createTimeLogger } from "@/utils/time/errors";
import { 
  ToilMonthProcessingState, 
  ToilProcessingStatus 
} from "@/types/monthEndToil";
import { TOIL_MONTH_PROCESSING_STATE_KEY } from "../../storage/constants";
import { TOILProcessingCore } from "./core";

const logger = createTimeLogger('TOILService-Processing-State');

/**
 * State management for TOIL processing
 */
export class TOILProcessingStateManager extends TOILProcessingCore {
  /**
   * Get TOIL month processing state
   */
  public getMonthProcessingState(userId: string, month: string): ToilMonthProcessingState | null {
    try {
      const states = localStorage.getItem(TOIL_MONTH_PROCESSING_STATE_KEY);
      const allStates: ToilMonthProcessingState[] = states ? JSON.parse(states) : [];
      
      const state = allStates.find(state => state.userId === userId && state.month === month);
      
      logger.debug(`Got processing state for user ${userId}, month ${month}:`, state || 'Not found');
      
      return state || null;
    } catch (error) {
      logger.error("Error fetching TOIL month processing state:", error);
      return null;
    }
  }

  /**
   * Update TOIL month processing state
   */
  public updateMonthProcessingState(
    userId: string,
    month: string,
    status: ToilProcessingStatus
  ): void {
    try {
      logger.debug(`Updating processing state for user ${userId}, month ${month} to ${status}`);
      
      const states = localStorage.getItem(TOIL_MONTH_PROCESSING_STATE_KEY);
      const allStates: ToilMonthProcessingState[] = states ? JSON.parse(states) : [];
      
      const existingIndex = allStates.findIndex(
        state => state.userId === userId && state.month === month
      );
      
      const newState: ToilMonthProcessingState = {
        userId,
        month,
        status,
        lastUpdated: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        allStates[existingIndex] = newState;
        logger.debug(`Updated existing processing state for ${month}`);
      } else {
        allStates.push(newState);
        logger.debug(`Created new processing state for ${month}`);
      }
      
      localStorage.setItem(TOIL_MONTH_PROCESSING_STATE_KEY, JSON.stringify(allStates));
      
      // Dispatch event for UI update
      const event = new CustomEvent("toil-month-state-updated", { 
        detail: { 
          state: newState,
          userId,
          month
        } 
      });
      window.dispatchEvent(event);
      
      logger.debug(`Processing state updated and event dispatched for ${month}`);
    } catch (error) {
      logger.error("Error updating TOIL month processing state:", error);
      throw error;
    }
  }
}
