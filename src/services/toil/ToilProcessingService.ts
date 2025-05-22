
/**
 * @deprecated Use direct methods from toilService instead
 */
import { ToilProcessingRecord } from "@/types/monthEndToil";

// Provide a minimal implementation to satisfy the imports
export const fetchToilProcessingRecords = (): ToilProcessingRecord[] => {
  console.warn("fetchToilProcessingRecords is deprecated. Use toilService methods directly.");
  // Get records from localStorage or return empty array
  const recordsJson = localStorage.getItem("toil_processing_records");
  return recordsJson ? JSON.parse(recordsJson) : [];
};

export const saveToilProcessingRecord = (record: ToilProcessingRecord): void => {
  console.warn("saveToilProcessingRecord is deprecated. Use toilService methods directly.");
  const records = fetchToilProcessingRecords();
  const existingIndex = records.findIndex(r => r.id === record.id);
  
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }
  
  localStorage.setItem("toil_processing_records", JSON.stringify(records));
};
