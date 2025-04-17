
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/TimeEntryContext";

const ToilSummary = () => {
  const { entries, calculateTotalHours } = useTimeEntryContext();
  
  // Calculate TOIL (Time Off In Lieu) - simplified example
  const toilHours = React.useMemo(() => {
    // Filter entries that are marked as overtime or TOIL eligible
    const toilEligibleEntries = entries.filter(entry => 
      entry.isOvertime || entry.isToilEligible
    );
    
    // Calculate total TOIL hours
    return calculateTotalHours(toilEligibleEntries);
  }, [entries, calculateTotalHours]);

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-xl font-bold mb-4">TOIL Balance</h3>
        
        <div className="text-4xl font-bold mb-1">
          {toilHours.toFixed(1)} <span className="text-lg text-gray-500">hrs</span>
        </div>
        
        <div className="text-sm text-gray-500 mt-4">
          Time Off In Lieu available to use
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(ToilSummary);
