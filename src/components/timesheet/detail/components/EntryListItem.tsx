import React from "react";
import { TimeEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDisplayHours } from "@/utils/time/formatting";
import { TOIL_JOB_NUMBER } from "@/utils/time/services/toil-service";
import { cn } from "@/lib/utils";
interface EntryListItemProps {
  entry: TimeEntry;
  onDelete?: () => void;
  interactive?: boolean;
  isDeleting?: boolean;
}
const EntryListItem: React.FC<EntryListItemProps> = ({
  entry,
  onDelete,
  interactive = true,
  isDeleting = false
}) => {
  const isToilUsage = entry.jobNumber === TOIL_JOB_NUMBER;
  return <div className={cn("flex justify-between items-center p-3 rounded-md border", isToilUsage ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200")}>
      <div className="flex-1 pr-4">
        <div className="flex items-center justify-between">
          <div className={cn("font-medium", isToilUsage ? "text-amber-800" : "text-gray-900")}>
            {entry.description || "No description"}
          </div>
          <div className="text-right">
            <span className="font-semibold text-lg">
              {formatDisplayHours(entry.hours)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-1 text-sm">
          {entry.jobNumber && <div className={cn("px-2 py-0.5 rounded-full text-xs", isToilUsage ? "bg-amber-200 text-amber-800" : "bg-blue-100 text-blue-800")}>
              Job: {entry.jobNumber}
            </div>}
          
          {entry.project && !isToilUsage && <div className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs mx-[16px]">
              {entry.project}
            </div>}
          
          {entry.rego && <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs mx-0">
              Rego: {entry.rego}
            </div>}
          
          {isToilUsage && <div className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-xs">
              TOIL Usage
            </div>}
        </div>
      </div>
      
      {interactive && onDelete && <Button variant="ghost" size="sm" onClick={onDelete} disabled={isDeleting} className="text-gray-500 hover:text-red-500">
          <Trash2 className="h-4 w-4" />
        </Button>}
    </div>;
};
export default EntryListItem;