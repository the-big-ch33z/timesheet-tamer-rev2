
import React from 'react';
import { TimeEntry } from '@/types';
import { format } from 'date-fns';

interface EntryReviewStepProps {
  values: Partial<TimeEntry>;
}

const EntryReviewStep: React.FC<EntryReviewStepProps> = ({ values }) => {
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
          
          <div className="flex flex-wrap gap-3">
            {values.jobNumber && <span className="text-sm text-gray-700">Job: {values.jobNumber}</span>}
            {values.rego && <span className="text-sm text-gray-700">Rego: {values.rego}</span>}
            {values.taskNumber && <span className="text-sm text-gray-700">Task: {values.taskNumber}</span>}
          </div>
          
          {values.description && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{values.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntryReviewStep;
