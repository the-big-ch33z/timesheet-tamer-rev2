
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EntryFieldConfig } from "@/types";

interface CustomFieldsProps {
  visibleFields: EntryFieldConfig[];
  jobNumber: string;
  setJobNumber: (value: string) => void;
  rego: string;
  setRego: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  hours: string;
  setHours: (value: string) => void;
}

const CustomFields: React.FC<CustomFieldsProps> = ({
  visibleFields,
  jobNumber,
  setJobNumber,
  rego,
  setRego,
  description,
  setDescription,
  hours,
  setHours,
}) => {
  // Render specific field based on field type and name
  const renderField = (field: EntryFieldConfig) => {
    switch (field.name.toLowerCase()) {
      case 'job number':
        return (
          <Input
            id="jobNumber"
            type="text"
            value={jobNumber}
            onChange={(e) => setJobNumber(e.target.value)}
            placeholder={field.placeholder || "Job No."}
            required={field.required}
          />
        );
      case 'rego':
        return (
          <Input
            id="rego"
            type="text"
            value={rego}
            onChange={(e) => setRego(e.target.value)}
            placeholder={field.placeholder || "Rego"}
            required={field.required}
          />
        );
      case 'notes':
        return (
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={field.placeholder || "Notes"}
            required={field.required}
          />
        );
      case 'hours':
        return (
          <Input
            id="hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder={field.placeholder || "Hrs"}
            required={field.required}
            className={field.size === 'small' ? "w-24" : ""}
          />
        );
      default:
        if (!field.name) return null;
        
        return field.type === 'textarea' ? (
          <Textarea
            id={`custom-${field.id}`}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        ) : (
          <Input
            id={`custom-${field.id}`}
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Render Job Number and Rego fields in a grid if they exist */}
      {visibleFields.some(f => 
        f.name.toLowerCase() === 'job number' || f.name.toLowerCase() === 'rego'
      ) && (
        <div className="grid grid-cols-2 gap-4">
          {visibleFields.filter(f => f.name.toLowerCase() === 'job number').map(field => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor="jobNumber">{field.name}</Label>
              {renderField(field)}
            </div>
          ))}

          {visibleFields.filter(f => f.name.toLowerCase() === 'rego').map(field => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor="rego">{field.name}</Label>
              {renderField(field)}
            </div>
          ))}
        </div>
      )}

      {/* Render Notes field if it exists */}
      {visibleFields.filter(f => f.name.toLowerCase() === 'notes').map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor="description">{field.name}</Label>
          {renderField(field)}
        </div>
      ))}

      {/* Render Hours field if it exists */}
      {visibleFields.filter(f => f.name.toLowerCase() === 'hours').map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor="hours">{field.name}</Label>
          {renderField(field)}
        </div>
      ))}

      {/* Render other custom fields if they exist */}
      {visibleFields.filter(f => 
        !['job number', 'rego', 'notes', 'hours', ''].includes(f.name.toLowerCase())
      ).map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={`custom-${field.id}`}>{field.name}</Label>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
};

export default CustomFields;
