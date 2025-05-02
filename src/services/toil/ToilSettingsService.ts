
import { ToilThresholds } from "@/types/monthEndToil";

// Storage key for TOIL thresholds
const TOIL_THRESHOLDS_KEY = "toil_thresholds";

// Default thresholds
const DEFAULT_THRESHOLDS: ToilThresholds = {
  fullTime: 8,
  partTime: 6,
  casual: 4
};

// Fetch TOIL thresholds from storage or use defaults
export const fetchToilThresholds = (): ToilThresholds => {
  try {
    const storedThresholds = localStorage.getItem(TOIL_THRESHOLDS_KEY);
    return storedThresholds ? JSON.parse(storedThresholds) : DEFAULT_THRESHOLDS;
  } catch (error) {
    console.error("Error fetching TOIL thresholds:", error);
    return DEFAULT_THRESHOLDS;
  }
};

// Save TOIL thresholds to storage
export const saveToilThresholds = (thresholds: ToilThresholds): boolean => {
  try {
    localStorage.setItem(TOIL_THRESHOLDS_KEY, JSON.stringify(thresholds));
    return true;
  } catch (error) {
    console.error("Error saving TOIL thresholds:", error);
    return false;
  }
};

// Reset TOIL thresholds to defaults
export const resetToilThresholds = (): ToilThresholds => {
  localStorage.setItem(TOIL_THRESHOLDS_KEY, JSON.stringify(DEFAULT_THRESHOLDS));
  return DEFAULT_THRESHOLDS;
};
