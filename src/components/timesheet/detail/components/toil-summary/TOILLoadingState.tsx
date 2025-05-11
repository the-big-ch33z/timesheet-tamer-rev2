
import React from "react";

const TOILLoadingState: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3].map(key => (
          <div 
            key={key} 
            className="flex-1 min-w-[100px] rounded-lg border bg-blue-100/40 border-blue-100 px-4 py-3 animate-pulse"
            data-testid="loading-indicator"
          >
            <div className="h-4 w-6 mb-3 rounded bg-blue-200/60"></div>
            <div className="h-6 w-14 mb-2 rounded bg-blue-200/60"></div>
            <div className="h-3 w-10 rounded bg-blue-100"></div>
          </div>
        ))}
      </div>
      <div className="h-3 rounded bg-blue-100/70 mt-4 animate-pulse w-full"></div>
    </div>
  );
};

export default TOILLoadingState;
