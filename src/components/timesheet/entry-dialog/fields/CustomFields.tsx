
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
  inline?: boolean;
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
  inline = false,
}) => {
  // Render specific field based on field type and name
  const renderField = (field: EntryFieldConfig, showLabel = true) => {
    const fieldId = `field-${field.id}`;
    
    switch (field.name.toLowerCase()) {
      case 'job number':
        return (
          <div className={inline ? "flex-1 min-w-20" : "space-y-2"}>
            {showLabel && !inline && <Label htmlFor={fieldId}>{field.name}</Label>}
            <Input
              id={fieldId}
              type="text"
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              placeholder={field.placeholder || "Job No."}
              required={field.required}
              className={inline ? "h-9" : ""}
            />
          </div>
        );
      case 'rego':
        return (
          <div className={inline ? "flex-1 min-w-20" : "space-y-2"}>
            {showLabel && !inline && <Label htmlFor={fieldId}>{field.name}</Label>}
            <Input
              id={fieldId}
              type="text"
              value={rego}
              onChange={(e) => setRego(e.target.value)}
              placeholder={field.placeholder || "Rego"}
              required={field.required}
              className={inline ? "h-9" : ""}
            />
          </div>
        );
      case 'notes':
        return (
          <div className={inline ? "flex-1 min-w-40" : "space-y-2"}>
            {showLabel && !inline && <Label htmlFor={fieldId}>{field.name}</Label>}
            {inline ? (
              <Input
                id={fieldId}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={field.placeholder || "Notes"}
                required={field.required}
                className="h-9"
              />
            ) : (
              <Textarea
                id={fieldId}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={field.placeholder || "Notes"}
                required={field.required}
              />
            )}
          </div>
        );
      case 'hours':
        return (
          <div className={inline ? "w-24" : "space-y-2"}>
            {showLabel && !inline && <Label htmlFor={fieldId}>{field.name}</Label>}
            <Input
              id={fieldId}
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder={field.placeholder || "Hrs"}
              required={field.required}
              className={inline ? "h-9" : ""}
            />
          </div>
        );
      default:
        if (!field.name) return null;
        
        return (
          <div className={inline ? "flex-1" : "space-y-2"}>
            {showLabel && !inline && <Label htmlFor={fieldId}>{field.name}</Label>}
            {field.type === 'textarea' && !inline ? (
              <Textarea
                id={fieldId}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
              />
            ) : (
              <Input
                id={fieldId}
                type={field.type}
                placeholder={field.placeholder}
                required={field.required}
                className={inline ? "h-9" : ""}
              />
            )}
          </div>
        );
    }
  };

  if (inline) {
    return (
      <div className="flex gap-2 flex-grow">
        {visibleFields.map(field => field.visible && renderField(field, false))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Only render visible fields */}
      <div className="grid grid-cols-2 gap-4">
        {visibleFields.filter(f => f.visible && f.name.toLowerCase() === 'job number').map(field => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`field-${field.id}`}>{field.name}</Label>
            {renderField(field)}
          </div>
        ))}

        {visibleFields.filter(f => f.visible && f.name.toLowerCase() === 'rego').map(field => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`field-${field.id}`}>{field.name}</Label>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Render Notes field if it exists and is visible */}
      {visibleFields.filter(f => f.visible && f.name.toLowerCase() === 'notes').map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={`field-${field.id}`}>{field.name}</Label>
          {renderField(field)}
        </div>
      ))}

      {/* Render Hours field if it exists and is visible */}
      {visibleFields.filter(f => f.visible && f.name.toLowerCase() === 'hours').map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={`field-${field.id}`}>{field.name}</Label>
          {renderField(field)}
        </div>
      ))}

      {/* Render other custom fields if they exist and are visible */}
      {visibleFields.filter(f => 
        f.visible && !['job number', 'rego', 'notes', 'hours', ''].includes(f.name.toLowerCase())
      ).map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={`field-${field.id}`}>{field.name}</Label>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
};

export default CustomFields;
