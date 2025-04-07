
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const MonthlyHours: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-xl font-bold mb-4">Monthly Hours</h3>
        
        <div className="text-4xl font-bold mb-1">
          0.0 <span className="text-lg text-gray-500">/ 159.6 hrs</span>
        </div>
        
        <div className="text-right mb-2">0%</div>
        
        <Progress value={0} className="h-2 mb-4" />
        
        <div className="text-sm text-gray-500">
          159.6 hours remaining to meet target
        </div>
        <div className="text-sm text-gray-500">
          Based on 19.9 work days this month
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyHours;
