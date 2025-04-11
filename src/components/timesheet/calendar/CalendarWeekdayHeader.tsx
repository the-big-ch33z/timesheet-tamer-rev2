
import React from "react";

const CalendarWeekdayHeader: React.FC = () => {
  return (
    <div className="grid grid-cols-7 gap-2 mb-2">
      {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
        <div
          key={day}
          className={`py-2 text-center text-sm font-medium ${
            i === 0 || i === 6 ? "text-red-500" : "text-gray-700"
          }`}
        >
          {day}
        </div>
      ))}
    </div>
  );
};

export default CalendarWeekdayHeader;
