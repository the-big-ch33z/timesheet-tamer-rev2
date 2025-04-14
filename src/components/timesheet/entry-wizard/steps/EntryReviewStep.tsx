
import React from 'react';
import { TimeEntry } from '@/types';
import { Card } from '@/components/ui/card';

interface EntryReviewStepProps {
  values: Partial<TimeEntry>;
}

const EntryReviewStep: React.FC<EntryReviewStepProps> = ({ values }) => {
  // Format fields for display
  const formatField = (value: any): string => {
    if (value === undefined || value === null || value === '') {
      return 'Not specified';
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Hours</h4>
              <p className="text-sm">{formatField(values.hours)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Job Number</h4>
              <p className="text-sm">{formatField(values.jobNumber)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Rego</h4>
              <p className="text-sm">{formatField(values.rego)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Task Number</h4>
              <p className="text-sm">{formatField(values.taskNumber)}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Description</h4>
            <p className="text-sm whitespace-pre-wrap">{formatField(values.description)}</p>
          </div>
        </div>
      </Card>
      
      <div className="text-sm text-gray-600">
        <p>Please review the information above before submitting your timesheet entry.</p>
      </div>
    </div>
  );
};

export default EntryReviewStep;
