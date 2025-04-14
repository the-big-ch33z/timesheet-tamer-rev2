
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p>{values.date ? format(new Date(values.date), 'MMMM d, yyyy') : 'Not specified'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Hours</p>
              <p className="font-medium">{values.hours || 0}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Job Number</p>
              <p>{values.jobNumber || 'Not specified'}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Rego</p>
              <p>{values.rego || 'Not specified'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Task Number</p>
              <p>{values.taskNumber || 'Not specified'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Start/End Time</p>
              <p>{values.startTime || '09:00'} - {values.endTime || '17:00'}</p>
            </div>
          </div>
        </div>
        
        {values.description && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="whitespace-pre-wrap">{values.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntryReviewStep;
