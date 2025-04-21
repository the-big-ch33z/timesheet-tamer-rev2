
import React from "react";
import { TimeEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDisplayHours } from "@/utils/time/formatting";
import { TOIL_JOB_NUMBER } from "@/utils/time/services/toil-service";
import { cn } from "@/lib/utils";

// Reusable Badge component for compact badges
const SlimBadge: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", className)}>{children}</span>
);

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

  // "General" badge comes from the `project` field; we clarify this in the comment below.
  // If project is present and not "General", show the badge.
  const showProjectBadge =
    entry.project && entry.project !== "General";

  // Layout: Top row has Hours, Rego, Job No, Task No, delete; second row is Description
  return (
    <div
      className={cn(
        "flex flex-col gap-1 p-2 rounded-lg border transition-shadow hover:shadow-sm",
        isToilUsage ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"
      )}
      style={{ minHeight: "unset" }}
    >
      {/* First row: horizontal fields */}
      <div className="flex items-center w-full gap-2">
        <div className={cn("font-semibold text-base", isToilUsage ? "text-amber-800" : "text-gray-900")}>
          {formatDisplayHours(entry.hours)}
        </div>
        {/* Rego badge */}
        {entry.rego && (
          <SlimBadge className="bg-green-100 text-green-800 ml-1">
            Rego: {entry.rego}
          </SlimBadge>
        )}
        {/* Job Number badge */}
        {entry.jobNumber && (
          <SlimBadge className={isToilUsage ? "bg-amber-200 text-amber-800 ml-1" : "bg-blue-100 text-blue-800 ml-1"}>
            Job: {entry.jobNumber}
          </SlimBadge>
        )}
        {/* Task Number badge */}
        {entry.taskNumber && (
          <SlimBadge className="bg-gray-100 text-gray-700 ml-1">
            Task: {entry.taskNumber}
          </SlimBadge>
        )}
        {/* Project (General) badge - only if not "General" */}
        {showProjectBadge && (
          <SlimBadge className="bg-purple-100 text-purple-800 ml-1">
            {entry.project}
          </SlimBadge>
        )}
        {/* TOIL Usage badge */}
        {isToilUsage && (
          <SlimBadge className="bg-amber-200 text-amber-800 ml-1">
            TOIL Usage
          </SlimBadge>
        )}

        {/* Grow, then Hours on right, then trash */}
        <div className="flex-1" />

        {interactive && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-gray-500 hover:text-red-500 p-2"
            tabIndex={0}
            aria-label="Delete entry"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Description field, full width */}
      <div className={cn("text-sm text-gray-700 pl-1 mt-0.5 break-all")}>
        {entry.description || <span className="italic text-gray-400">No description</span>}
      </div>
    </div>
  );
};
export default EntryListItem;
