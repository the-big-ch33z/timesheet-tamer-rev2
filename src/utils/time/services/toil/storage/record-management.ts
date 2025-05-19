
/**
 * This file re-exports all record management functions from individual operation files
 * To maintain a clean structure while providing a unified API
 */

// Re-export record operations
export { 
  storeTOILRecord,
  deleteUserTOILRecords,
  deleteTOILRecordById,
  deleteTOILRecordsByEntryId
} from './record-operations';

// Re-export usage operations
export {
  storeTOILUsage 
} from './usage-operations';

// Re-export summary operations (assuming these are implemented elsewhere)
export const storeTOILSummary = () => {
  // This is just a placeholder for now
  return Promise.resolve(true);
};

