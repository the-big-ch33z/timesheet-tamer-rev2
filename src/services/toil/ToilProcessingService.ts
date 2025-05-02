
import { v4 as uuidv4 } from "uuid";
import { ToilProcessingRecord, ToilProcessingFormData, ToilMonthProcessingState, ToilProcessingStatus } from "@/types/monthEndToil";
import { format } from "date-fns";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { toilService } from "@/utils/time/services/toil";
import { TOILSummary } from "@/types/toil";

// Storage keys
const TOIL_PROCESSING_RECORDS_KEY = "toil_processing_records";
const TOIL_MONTH_PROCESSING_STATE_KEY = "toil_month_processing_state";

// Fetch TOIL processing records
export const fetchToilProcessingRecords = (): ToilProcessingRecord[] => {
  try {
    const records = localStorage.getItem(TOIL_PROCESSING_RECORDS_KEY);
    return records ? JSON.parse(records) : [];
  } catch (error) {
    console.error("Error fetching TOIL processing records:", error);
    return [];
  }
};

// Save TOIL processing records
const saveToilProcessingRecords = (records: ToilProcessingRecord[]): void => {
  localStorage.setItem(TOIL_PROCESSING_RECORDS_KEY, JSON.stringify(records));
};

// Get TOIL processing records for a user
export const getUserToilProcessingRecords = (userId: string): ToilProcessingRecord[] => {
  const records = fetchToilProcessingRecords();
  return records.filter(record => record.userId === userId);
};

// Get TOIL processing record by ID
export const getToilProcessingRecordById = (id: string): ToilProcessingRecord | null => {
  const records = fetchToilProcessingRecords();
  const record = records.find(record => record.id === id);
  return record || null;
};

// Get TOIL processing record for a specific month
export const getToilProcessingRecordForMonth = (userId: string, month: string): ToilProcessingRecord | null => {
  const records = getUserToilProcessingRecords(userId);
  return records.find(record => record.month === month) || null;
};

// Submit TOIL processing request
export const submitToilProcessing = (data: ToilProcessingFormData): ToilProcessingRecord => {
  const records = fetchToilProcessingRecords();
  
  // Check if a record already exists for this month
  const existingIndex = records.findIndex(
    record => record.userId === data.userId && record.month === data.month
  );

  const processingRecord: ToilProcessingRecord = {
    id: existingIndex >= 0 ? records[existingIndex].id : uuidv4(),
    userId: data.userId,
    month: data.month,
    totalHours: data.totalHours,
    rolloverHours: data.rolloverHours,
    surplusHours: data.surplusHours,
    surplusAction: data.surplusAction,
    status: "pending",
    submittedAt: new Date().toISOString(),
    originalRecords: [], // Would be populated with actual TOIL record IDs
  };

  if (existingIndex >= 0) {
    records[existingIndex] = processingRecord;
  } else {
    records.push(processingRecord);
  }

  saveToilProcessingRecords(records);
  
  // Update the month processing state
  updateMonthProcessingState(data.userId, data.month, ToilProcessingStatus.IN_PROGRESS);
  
  // Dispatch event for UI update
  // Use CustomEvent instead of timeEventsService to avoid type errors
  const event = new CustomEvent("toil-month-end-submitted", { detail: processingRecord });
  window.dispatchEvent(event);
  
  return processingRecord;
};

// Get TOIL month processing state
export const getMonthProcessingState = (userId: string, month: string): ToilMonthProcessingState | null => {
  try {
    const states = localStorage.getItem(TOIL_MONTH_PROCESSING_STATE_KEY);
    const allStates: ToilMonthProcessingState[] = states ? JSON.parse(states) : [];
    
    return allStates.find(state => state.userId === userId && state.month === month) || null;
  } catch (error) {
    console.error("Error fetching TOIL month processing state:", error);
    return null;
  }
};

// Update TOIL month processing state
export const updateMonthProcessingState = (
  userId: string,
  month: string,
  status: ToilProcessingStatus
): void => {
  try {
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
    } else {
      allStates.push(newState);
    }
    
    localStorage.setItem(TOIL_MONTH_PROCESSING_STATE_KEY, JSON.stringify(allStates));
    
    // Dispatch event for UI update
    // Use CustomEvent instead of timeEventsService to avoid type errors
    const event = new CustomEvent("toil-month-state-updated", { detail: newState });
    window.dispatchEvent(event);
  } catch (error) {
    console.error("Error updating TOIL month processing state:", error);
  }
};

// Fetch TOIL by month using existing toilService
export const fetchToilByMonth = async (userId: string, month: string): Promise<TOILSummary | null> => {
  // Assuming toilService has a method to get TOIL summary by month
  return toilService.getTOILSummary(userId, month);
};
