
import React from "react";
import { AlertCircle } from "lucide-react";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TOILErrorState');

interface TOILErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
}

/**
 * Error state component for TOIL summary display
 */
export const TOILErrorState: React.FC<TOILErrorStateProps> = ({ error, onRetry }) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  // Log the error for debugging
  React.useEffect(() => {
    logger.error('TOILErrorState rendered with error:', errorMessage);
  }, [errorMessage]);
  
  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex flex-col items-center">
      <div className="flex items-center mb-2">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
        <h4 className="text-red-700 font-medium">Unable to load TOIL summary</h4>
      </div>
      
      <p className="text-sm text-red-600 mb-3 text-center">
        {errorMessage || 'An unknown error occurred'}
      </p>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default TOILErrorState;
