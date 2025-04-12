
import React from "react";
import { format } from "date-fns";

interface EntriesHeaderProps {
  date: Date;
  readOnly: boolean;
}

const EntriesHeader: React.FC<EntriesHeaderProps> = ({
  date,
  readOnly
}) => {
  const dayName = format(date, "EEEE");
  
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">
        {dayName}'s Entries
      </h3>
    </div>
  );
};

export default EntriesHeader;
