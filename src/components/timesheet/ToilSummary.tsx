
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TimeEntry } from "@/types";

interface ToilSummaryProps {
  entries: TimeEntry[];
}

const ToilSummary: React.FC<ToilSummaryProps> = ({ entries }) => {
  // For demo purposes - in a real app, this would calculate TOIL from entries
  const earned = entries.filter(entry => entry.description?.toLowerCase().includes('toil')).reduce((sum, entry) => sum + entry.hours, 0);
  const used = 0.0;
  const remaining = earned - used;
  
  // Calculate balance percentage (50% is neutral)
  const balancePercentage = 50; // In a real app, this would be calculated based on earned/used

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-xl font-bold text-indigo-600 mb-4">TOIL Summary</h3>
        
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600">{earned.toFixed(1)}</div>
            <div className="text-sm text-gray-500">hours</div>
            <div className="text-sm">Earned</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-500">{used.toFixed(1)}</div>
            <div className="text-sm text-gray-500">hours</div>
            <div className="text-sm">Used</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-500">{remaining.toFixed(1)}</div>
            <div className="text-sm text-gray-500">hours</div>
            <div className="text-sm">Remaining</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Balance</div>
          <Progress 
            value={balancePercentage} 
            className="h-2" 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ToilSummary;
