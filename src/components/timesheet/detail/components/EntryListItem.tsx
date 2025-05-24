
import React from "react";
import { TimeEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDisplayHours } from "@/utils/time/formatting/timeFormatting";
import { TOIL_JOB_NUMBER } from "@/utils/time/services/toil-service";
import { cn } from "@/lib/utils";
import { TableCell, TableRow } from "@/components/ui/table";

// Slim and visually prominent badge for pill/tag styling
const FieldBadge: React.FC<{ className?: string; children: React.ReactNode }> = ({
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
    <>
      {/* Desktop table row */}
      <TableRow className="hidden md:table-row hover:bg-gray-50">
        <TableCell>
          <FieldBadge
            className={cn(
              "bg-blue-600 text-white shadow min-w-[52px] justify-center",
              isToilUsage && "bg-amber-500"
            )}
          >
            {formatDisplayHours(entry.hours)}
          </FieldBadge>
        </TableCell>
        <TableCell>
          {entry.rego && (
            <FieldBadge className="bg-green-100 text-green-900 border border-green-200">
              {entry.rego}
            </FieldBadge>
          )}
        </TableCell>
        <TableCell>
          {entry.jobNumber && (
            <FieldBadge
              className={cn(
                "bg-blue-100 text-blue-900 border border-blue-200",
                isToilUsage && "bg-amber-200 text-amber-900 border-amber-300"
              )}
            >
              {entry.jobNumber}
            </FieldBadge>
          )}
        </TableCell>
        <TableCell>
          {entry.taskNumber && (
            <FieldBadge className="bg-gray-100 text-gray-800 border border-gray-200">
              {entry.taskNumber}
            </FieldBadge>
          )}
        </TableCell>
        <TableCell className="text-sm text-gray-700">
          {entry.description || (
            <span className="italic text-gray-400">No description</span>
          )}
        </TableCell>
        {interactive && (
          <TableCell className="text-right">
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                disabled={isDeleting}
                className="text-gray-500 hover:text-red-500"
                tabIndex={0}
                aria-label="Delete entry"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </TableCell>
        )}
      </TableRow>

      {/* Mobile responsive card layout */}
      <TableRow className="md:hidden">
        <TableCell colSpan={interactive ? 6 : 5} className="p-0">
          <div
            className={cn(
              "flex flex-col gap-3 p-4 border-b border-gray-100",
              isToilUsage && "bg-amber-50"
            )}
          >
            {/* Mobile field layout with labels */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hours</span>
                <FieldBadge
                  className={cn(
                    "bg-blue-600 text-white shadow",
                    isToilUsage && "bg-amber-500"
                  )}
                >
                  {formatDisplayHours(entry.hours)}
                </FieldBadge>
              </div>
              
              {entry.rego && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rego</span>
                  <FieldBadge className="bg-green-100 text-green-900 border border-green-200">
                    {entry.rego}
                  </FieldBadge>
                </div>
              )}
              
              {entry.jobNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Job Number</span>
                  <FieldBadge
                    className={cn(
                      "bg-blue-100 text-blue-900 border border-blue-200",
                      isToilUsage && "bg-amber-200 text-amber-900 border-amber-300"
                    )}
                  >
                    {entry.jobNumber}
                  </FieldBadge>
                </div>
              )}
              
              {entry.taskNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Task Number</span>
                  <FieldBadge className="bg-gray-100 text-gray-800 border border-gray-200">
                    {entry.taskNumber}
                  </FieldBadge>
                </div>
              )}
              
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</span>
                <div className="text-sm text-gray-700 text-right max-w-[200px]">
                  {entry.description || (
                    <span className="italic text-gray-400">No description</span>
                  )}
                </div>
              </div>
              
              {interactive && onDelete && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="text-gray-500 hover:text-red-500"
                    tabIndex={0}
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
};

export default EntryListItem;
