import React, { createContext, useContext, useState, useEffect } from 'react';
import { EntryFieldConfig } from '@/types';

// Default entry fields - only a single row (4 fields)
const DEFAULT_ENTRY_FIELDS: EntryFieldConfig[] = [
  { id: '1', name: 'Job Number', type: 'text', required: false, visible: true, placeholder: 'Job No.' },
  { id: '2', name: 'Rego', type: 'text', required: false, visible: true, placeholder: 'Rego' },
  { id: '3', name: 'Notes', type: 'textarea', required: false, visible: true, placeholder: 'Notes' },
  { id: '4', name: 'Hours', type: 'number', required: false, visible: true, placeholder: 'Hrs', size: 'small' },
];

interface TimesheetSettingsContextType {
  entryFields: EntryFieldConfig[];
  updateEntryFields: (fields: EntryFieldConfig[]) => void;
  getVisibleFields: () => EntryFieldConfig[];
}

const TimesheetSettingsContext = createContext<TimesheetSettingsContextType>({
  entryFields: DEFAULT_ENTRY_FIELDS,
  updateEntryFields: () => {},
  getVisibleFields: () => [],
});

export const useTimesheetSettings = () => useContext(TimesheetSettingsContext);

export const TimesheetSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entryFields, setEntryFields] = useState<EntryFieldConfig[]>(DEFAULT_ENTRY_FIELDS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedFields = localStorage.getItem('timesheetEntryFields');
      if (savedFields) {
        const parsedFields = JSON.parse(savedFields);
        // Ensure we only have 4 fields
        setEntryFields(parsedFields.slice(0, 4));
      }
    } catch (error) {
      console.error("Error loading timesheet settings:", error);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('timesheetEntryFields', JSON.stringify(entryFields));
  }, [entryFields]);

  const updateEntryFields = (fields: EntryFieldConfig[]) => {
    // Ensure we only save 4 fields
    setEntryFields(fields.slice(0, 4));
  };

  const getVisibleFields = () => {
    return entryFields.filter(field => field.visible);
  };

  return (
    <TimesheetSettingsContext.Provider 
      value={{ entryFields, updateEntryFields, getVisibleFields }}
    >
      {children}
    </TimesheetSettingsContext.Provider>
  );
};
