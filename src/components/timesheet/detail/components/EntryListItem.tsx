
import React from "react";
import { TimeEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDisplayHours } from "@/utils/time/formatting/timeFormatting";
import { TOIL_JOB_NUMBER } from "@/utils/time/services/toil-service";
import { cn } from "@/lib/utils";
import { TableCell, TableRow } from "@/components/ui/table";

// Reuse the existing badge component for consistency
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

  return (
    <TableRow className={cn(
      "hover:bg-gray-50 transition-colors",
      isToilUsage && "bg-amber-50 hover:bg-amber-100"
    )}>
      {/* Hours Column */}
      <TableCell>
        <TopFieldBadge
          className={cn(
            "bg-blue-600 text-white shadow",
            "text-base leading-tight min-w-[52px] justify-center",
            isToilUsage && "bg-amber-500"
          )}
        >
          {formatDisplayHours(entry.hours)}
        </TopFieldBadge>
      </TableCell>

      {/* Rego Column */}
      <TableCell>
        {entry.rego && (
          <TopFieldBadge className="bg-green-100 text-green-900 border border-green-200">
            {entry.rego}
          </TopFieldBadge>
        )}
      </TableCell>

      {/* Job Number Column */}
      <TableCell>
        {entry.jobNumber && (
          <TopFieldBadge
            className={cn(
              "bg-blue-100 text-blue-900 border border-blue-200",
              isToilUsage && "bg-amber-200 text-amber-900 border-amber-300"
            )}
          >
            {entry.jobNumber}
          </TopFieldBadge>
        )}
      </TableCell>

      {/* Task Number Column */}
      <TableCell>
        {entry.taskNumber && (
          <TopFieldBadge className="bg-gray-100 text-gray-800 border border-gray-200">
            {entry.taskNumber}
          </TopFieldBadge>
        )}
      </TableCell>

      {/* Description Column */}
      <TableCell>
        <div className="text-sm text-gray-700 break-all leading-snug">
          {entry.description || (
            <span className="italic text-gray-400">No description</span>
          )}
        </div>
      </TableCell>

      {/* Actions Column */}
      <TableCell className="text-right">
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
      </TableCell>
    </TableRow>
  );
};

export default EntryListItem;
