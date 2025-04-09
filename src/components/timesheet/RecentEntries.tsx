
import React from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";

interface RecentEntriesProps {
  entries: TimeEntry[];
}

const RecentEntries: React.FC<RecentEntriesProps> = ({ entries }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
      <h3 className="text-lg font-medium mb-4">Recent Time Entries</h3>
      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id} className="p-3 bg-white rounded-lg border border-gray-100 flex justify-between items-center">
            <div>
              <div className="font-medium">{entry.project}</div>
              <div className="text-sm text-gray-600 mt-1">
                {format(entry.date, "MMM dd, yyyy")} · {entry.description}
              </div>
              {(entry.jobNumber || entry.rego) && (
                <div className="text-xs text-gray-500 mt-1">
                  {entry.jobNumber && `Job: ${entry.jobNumber}`} 
                  {entry.jobNumber && entry.rego && ' • '} 
                  {entry.rego && `Rego: ${entry.rego}`}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-medium">{entry.hours} hours</div>
              {entry.startTime && entry.endTime && (
                <div className="text-xs text-gray-500 mt-1">{entry.startTime} - {entry.endTime}</div>
              )}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-gray-500 text-center py-4">No recent entries</p>
        )}
      </div>
    </div>
  );
};

export default RecentEntries;
