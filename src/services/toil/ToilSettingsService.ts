
/**
 * @deprecated This file is now deprecated - use toilService from "@/utils/time/services/toil" instead
 * It's kept for backward compatibility during the transition
 */

import { toilService } from "@/utils/time/services/toil";
import { ToilThresholds } from "@/types/monthEndToil";

// Re-export functions that use the unified service
export const fetchToilThresholds = (): ToilThresholds => {
  return toilService.fetchToilThresholds();
};

export const saveToilThresholds = (thresholds: ToilThresholds): boolean => {
  return toilService.saveToilThresholds(thresholds);
};

export const resetToilThresholds = (): ToilThresholds => {
  return toilService.resetToilThresholds();
};
