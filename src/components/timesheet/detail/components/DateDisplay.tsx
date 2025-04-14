
import React from 'react';

interface DateDisplayProps {
  date: string;
}

const DateDisplay: React.FC<DateDisplayProps> = ({ date }) => {
  return (
    <h2 className="text-xl font-bold mb-2 sm:mb-0">
      {date}
    </h2>
  );
};

export default DateDisplay;
