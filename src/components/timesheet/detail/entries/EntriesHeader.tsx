
import React from "react";
import { format } from "date-fns";
import { LockIcon } from "lucide-react";

interface EntriesHeaderProps {
  date: Date;
  readOnly: boolean;
}

const EntriesHeader: React.FC<EntriesHeaderProps> = ({
  date
}) => {
  const dayName = format(date, "EEEE");
  
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">
        {dayName}'s Entries
      </h3>
      <div className="flex items-center text-gray-500 text-sm">
        <LockIcon className="h-4 w-4 mr-1" />
        <span>View Only</span>
      </div>
    </div>
  );
};

export default EntriesHeader;
