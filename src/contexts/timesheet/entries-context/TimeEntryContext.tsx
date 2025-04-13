
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface TimeEntryContextProps {
  children: React.ReactNode;
  selectedDate: Date;
  userId?: string;
}

interface TimeEntryContextValue {
  entries: TimeEntry[];
  dayEntries: TimeEntry[];
  addEntry: (entry: Omit<TimeEntry, "id">) => void;
  updateEntry: (entryId: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (entryId: string) => void;
  calculateTotalHours: () => number;
  isLoading: boolean;
}

const TimeEntryContext = createContext<TimeEntryContextValue | undefined>(undefined);

export const useTimeEntryContext = () => {
  const context = useContext(TimeEntryContext);
  if (!context) {
    throw new Error('useTimeEntryContext must be used within a TimeEntryProvider');
  }
  return context;
};

export const TimeEntryProvider: React.FC<TimeEntryContextProps> = ({ 
  children, 
  selectedDate, 
  userId 
}) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load entries on mount
  useEffect(() => {
    const loadEntries = () => {
      try {
        const savedEntries = localStorage.getItem('timeEntries');
        if (savedEntries) {
          const parsedEntries = JSON.parse(savedEntries).map((entry: any) => ({
            ...entry,
            date: new Date(entry.date)
          }));
          setEntries(parsedEntries);
          console.log("Loaded entries from localStorage:", parsedEntries.length);
        }
      } catch (error) {
        console.error("Error loading entries:", error);
        toast({
          title: "Error loading entries",
          description: "Your entries could not be loaded. Please try refreshing the page.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [toast]);

  // Save entries when they change
  useEffect(() => {
    if (!isLoading) { // Don't save during initial load
      localStorage.setItem('timeEntries', JSON.stringify(entries));
      console.log("Saved entries to localStorage:", entries.length);
    }
  }, [entries, isLoading]);

  // Filter entries for the selected day
  const dayEntries = useCallback(() => {
    if (!selectedDate || !userId) return [];
    
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    return entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      const entryDateStr = format(entryDate, "yyyy-MM-dd");
      return entryDateStr === selectedDateStr && entry.userId === userId;
    });
  }, [entries, selectedDate, userId]);

  // Add a new entry
  const addEntry = useCallback((entryData: Omit<TimeEntry, "id">) => {
    const newEntry: TimeEntry = {
      ...entryData,
      id: uuidv4(),
    };

    setEntries(prev => [...prev, newEntry]);
    toast({
      title: "Entry added",
      description: `Added ${entryData.hours} hours to your timesheet`,
    });
  }, [toast]);

  // Update an existing entry
  const updateEntry = useCallback((entryId: string, updates: Partial<TimeEntry>) => {
    setEntries(prev => 
      prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, ...updates } 
          : entry
      )
    );
    
    toast({
      title: "Entry updated",
      description: "Your time entry has been updated",
    });
  }, [toast]);

  // Delete an entry
  const deleteEntry = useCallback((entryId: string) => {
    setEntries(prev => {
      const entryToDelete = prev.find(entry => entry.id === entryId);
      if (!entryToDelete) return prev;
      
      const filteredEntries = prev.filter(entry => entry.id !== entryId);
      
      toast({
        title: "Entry deleted",
        description: "Time entry has been removed from your timesheet"
      });
      
      return filteredEntries;
    });
  }, [toast]);

  // Calculate total hours for the current day
  const calculateTotalHours = useCallback(() => {
    return dayEntries().reduce((sum, entry) => sum + (entry.hours || 0), 0);
  }, [dayEntries]);

  const value: TimeEntryContextValue = {
    entries,
    dayEntries: dayEntries(),
    addEntry,
    updateEntry,
    deleteEntry,
    calculateTotalHours,
    isLoading
  };

  return (
    <TimeEntryContext.Provider value={value}>
      {children}
    </TimeEntryContext.Provider>
  );
};
