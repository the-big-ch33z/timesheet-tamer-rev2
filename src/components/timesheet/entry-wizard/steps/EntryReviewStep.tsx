
import React from 'react';
import { TimeEntry } from '@/types';
import { format } from 'date-fns';

interface EntryReviewStepProps {
  values: Partial<TimeEntry>;
}

const EntryReviewStep: React.FC<EntryReviewStepProps> = ({ values }) => {
  // Helper to check if a value exists and isn't empty
  const hasValue = (val: any) => val !== undefined && val !== null && val !== '';
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-500">Please review your entry details before submitting:</h4>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-3">
            <div className="font-medium text-gray-900">{values.hours || 0} hours</div>
            
            {values.date && (
              <div className="text-sm text-gray-500">
                {format(new Date(values.date), 'MMMM d, yyyy')}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {hasValue(values.jobNumber) && (
              <div className="text-sm">
                <span className="font-medium">Job Number:</span> {values.jobNumber}
              </div>
            )}
            
            {hasValue(values.rego) && (
              <div className="text-sm">
                <span className="font-medium">Rego:</span> {values.rego}
              </div>
            )}
            
            {hasValue(values.taskNumber) && (
              <div className="text-sm">
                <span className="font-medium">Task Number:</span> {values.taskNumber}
              </div>
            )}
            
            {hasValue(values.startTime) && (
              <div className="text-sm">
                <span className="font-medium">Start Time:</span> {values.startTime}
              </div>
            )}
            
            {hasValue(values.endTime) && (
              <div className="text-sm">
                <span className="font-medium">End Time:</span> {values.endTime}
              </div>
            )}
          </div>
          
          {hasValue(values.description) && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700">Description:</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200 mt-1">
                {values.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntryReviewStep;
