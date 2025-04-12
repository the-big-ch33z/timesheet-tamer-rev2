import React from "react";
import { EntryFieldConfig } from "@/types";
import { renderEntryField } from "../field-renderers/renderEntryField";

interface StandardFieldsGroupProps {
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

const StandardFieldsGroup: React.FC<StandardFieldsGroupProps> = ({
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
  // Filter fields by type for proper grouping
  const jobRegoTaskFields = visibleFields.filter(f => 
    f.visible && ['job number', 'rego', 'task number'].includes(f.name.toLowerCase())
  );
  
  const notesFields = visibleFields.filter(f => 
    f.visible && f.name.toLowerCase() === 'notes'
  );
  
  const hoursFields = visibleFields.filter(f => 
    f.visible && f.name.toLowerCase() === 'hours'
  );
  
  const otherFields = visibleFields.filter(f => 
    f.visible && 
    !['job number', 'rego', 'task number', 'notes', 'hours'].includes(f.name.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Job Number, Rego, and Task Number fields in a grid */}
      {jobRegoTaskFields.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {jobRegoTaskFields.map(field => (
            <div key={field.id}>
              {renderEntryField({
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
                disabled
              })}
            </div>
          ))}
        </div>
      )}

      {/* Notes field */}
      {notesFields.map(field => (
        <div key={field.id}>
          {renderEntryField({
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
            disabled
          })}
        </div>
      ))}

      {/* Hours field */}
      {hoursFields.map(field => (
        <div key={field.id}>
          {renderEntryField({
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
            disabled
          })}
        </div>
      ))}

      {/* Other custom fields */}
      {otherFields.map(field => (
        <div key={field.id}>
          {renderEntryField({
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
            disabled
          })}
        </div>
      ))}
    </div>
  );
};

export default StandardFieldsGroup;
