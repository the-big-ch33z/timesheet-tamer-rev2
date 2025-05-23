
import React from "react";
import { EntryFieldConfig } from "@/types";
import { renderEntryField } from "../field-renderers/renderEntryField";

interface InlineFieldsGroupProps {
  visibleFields: EntryFieldConfig[];
  jobNumber: string;
  setJobNumber: (value: string) => void;
  rego: string;
  setRego: (value: string) => void;
  taskNumber: string;
  setTaskNumber: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  hours: string;
  setHours: (value: string) => void;
  disabled?: boolean;
}

const InlineFieldsGroup: React.FC<InlineFieldsGroupProps> = ({
  visibleFields,
  jobNumber,
  setJobNumber,
  rego,
  setRego,
  taskNumber,
  setTaskNumber,
  description,
  setDescription,
  hours,
  setHours,
  disabled = false,
}) => {
  return (
    <div className="flex gap-2 flex-grow">
      {visibleFields.map(field => {
        if (!field.visible) return null;
        
        // Render the field directly instead of wrapping in a Fragment
        return renderEntryField({
          field,
          jobNumber,
          setJobNumber,
          rego,
          setRego,
          taskNumber,
          setTaskNumber,
          description,
          setDescription,
          hours,
          setHours,
          disabled,
          inline: true,
          showLabel: false,
          key: field.id // Add key here instead of on the Fragment
        });
      })}
    </div>
  );
};

export default InlineFieldsGroup;
