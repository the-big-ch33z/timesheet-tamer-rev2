
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const ToilSummary: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-xl font-bold text-indigo-600 mb-4">TOIL Summary</h3>
        
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600">0.0</div>
            <div className="text-sm text-gray-500">hours</div>
            <div className="text-sm">Earned</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-500">0.0</div>
            <div className="text-sm text-gray-500">hours</div>
            <div className="text-sm">Used</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-500">0.0</div>
            <div className="text-sm text-gray-500">hours</div>
            <div className="text-sm">Remaining</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Balance</div>
          <Progress value={50} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ToilSummary;
