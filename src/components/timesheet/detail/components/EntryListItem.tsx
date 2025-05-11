
import React from "react";
import { TimeEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDisplayHours } from "@/utils/time/formatting/timeFormatting";
import { TOIL_JOB_NUMBER } from "@/utils/time/services/toil/toilService"; // Fixed import path
import { cn } from "@/lib/utils";

// Slim and visually prominent badge for top-row info
const TopFieldBadge: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <span
    className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-sm font-semibold",
      className
    )}
  >
    {children}
  </span>
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
  isDeleting = false,
}) => {
  const isToilUsage = entry.jobNumber === TOIL_JOB_NUMBER;

  // No longer show "General" project badge
  // const showProjectBadge =
  //   entry.project && entry.project !== "General";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 p-2 rounded-lg border transition-shadow hover:shadow-sm bg-white border-gray-200",
        isToilUsage && "bg-amber-50 border-amber-200"
      )}
      style={{ minHeight: "unset" }}
    >
      {/* Top row: All key fields horizontally, visual emphasis increased */}
      <div className="flex items-center w-full gap-2">
        {/* Hours badge */}
        <TopFieldBadge
          className={cn(
            "bg-blue-600 text-white mr-1 min-w-[52px] justify-center shadow",
            "text-[1.28rem] leading-tight", // About 10% larger than default
            isToilUsage && "bg-amber-500"
          )}
        >
          {formatDisplayHours(entry.hours)}
        </TopFieldBadge>
        {/* Rego badge */}
        {entry.rego && (
          <TopFieldBadge className="bg-green-100 text-green-900 border border-green-200 mr-1 text-[1.07rem]">
            Rego: {entry.rego}
          </TopFieldBadge>
        )}
        {/* Job Number badge */}
        {entry.jobNumber && (
          <TopFieldBadge
            className={cn(
              "bg-blue-100 text-blue-900 border border-blue-200 mr-1 text-[1.07rem]",
              isToilUsage && "bg-amber-200 text-amber-900 border-amber-300"
            )}
          >
            Job: {entry.jobNumber}
          </TopFieldBadge>
        )}
        {/* Task Number badge */}
        {entry.taskNumber && (
          <TopFieldBadge className="bg-gray-100 text-gray-800 border border-gray-200 mr-1 text-[1.07rem]">
            Task: {entry.taskNumber}
          </TopFieldBadge>
        )}

        {/* TOIL badge (if relevant) */}
        {isToilUsage && (
          <TopFieldBadge className="bg-amber-200 text-amber-900 border border-amber-300 mr-1 text-[1.07rem]">
            TOIL Usage
          </TopFieldBadge>
        )}

        {/* Flexible spacer pushes trash to right edge */}
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
      {/* Description: single row, full width, compact */}
      <div className="text-sm text-gray-700 pl-1 mt-0.5 break-all leading-snug">
        {entry.description || (
          <span className="italic text-gray-400">No description</span>
        )}
      </div>
    </div>
  );
};

export default EntryListItem;
