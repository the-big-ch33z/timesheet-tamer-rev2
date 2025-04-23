
import React from "react";
import { Bell, Coffee } from "lucide-react";

/**
 * Show notification badges for lunch/smoko being included (i.e. subtracted)
 * or overriden (for lunch) in the hours summary.
 */
interface BreakInfoFlagsProps {
  breaksIncluded?: {
    lunch?: boolean;
    smoko?: boolean;
  };
  overrideStates?: {
    lunch?: boolean;
  };
}

const BreakInfoFlags: React.FC<BreakInfoFlagsProps> = ({
  breaksIncluded = {},
  overrideStates = {}
}) => {
  const { lunch, smoko } = breaksIncluded;
  const lunchOverride = overrideStates.lunch;

  // Only show if configured for the day or overridden
  if (!lunch && !smoko && !lunchOverride) return null;

  return (
    <div className="flex gap-2 mb-1 items-center">
      {/* Lunch flag */}
      {typeof lunch !== "undefined" && (
        lunch ? (
          <span className="flex items-center px-[0.35em] py-[0.1em] text-xs rounded-full bg-lime-50 border border-lime-200 text-lime-600 font-medium" title="Unpaid lunch subtracted from daily hours">
            <Bell className="h-4 w-4 mr-1 text-yellow-700" />
            Lunch subtracted
          </span>
        ) : (lunchOverride ? (
          <span className="flex items-center px-[0.35em] py-[0.1em] text-xs rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-medium" title="Lunch break worked through -- not subtracted">
            <Bell className="h-4 w-4 mr-1 text-blue-600" />
            Lunch override
          </span>
        ) : null)
      )}
      {/* Smoko flag */}
      {smoko && (
        <span className="flex items-center px-[0.35em] py-[0.1em] text-xs rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 font-medium" title="Unpaid smoko subtracted from daily hours">
          <Coffee className="h-4 w-4 mr-1 text-yellow-600" />
          Smoko subtracted
        </span>
      )}
    </div>
  );
};

export default BreakInfoFlags;
