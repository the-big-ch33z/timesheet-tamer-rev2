
import React from 'react';
import { Button } from '@/components/ui/button';

interface DebugPanelProps {
  userId: string;
  date: Date;
  onCalculateTOIL: () => void;
  isCalculating: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ 
  userId, 
  date, 
  onCalculateTOIL,
  isCalculating 
}) => {
  return (
    <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg mb-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-amber-800 mb-1">Debug Panel</h3>
          <p className="text-amber-700 mb-2">
            Date: {date.toISOString().split('T')[0]} | User ID: {userId.substring(0, 8)}...
          </p>
        </div>
        <div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onCalculateTOIL}
            disabled={isCalculating}
            className="bg-white"
          >
            {isCalculating ? 'Calculating...' : 'Calculate TOIL'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
