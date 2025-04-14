
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
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Load entries on mount - only once
  useEffect(() => {
    if (isInitialized) return;
    
    const loadEntries = () => {
      try {
        console.debug("[TimeEntryContext] Loading entries from localStorage");
        const savedEntries = localStorage.getItem('timeEntries');
        if (savedEntries) {
          const parsedEntries = JSON.parse(savedEntries).map((entry: any) => ({
            ...entry,
            date: new Date(entry.date)
          }));
          setEntries(parsedEntries);
          console.debug("[TimeEntryContext] Loaded entries from localStorage:", parsedEntries.length);
          console.debug("[TimeEntryContext] First few entries:", parsedEntries.slice(0, 3));
        } else {
          console.debug("[TimeEntryContext] No entries found in localStorage");
          // Initialize with empty array to prevent future loads
          localStorage.setItem('timeEntries', JSON.stringify([]));
        }
      } catch (error) {
        console.error("[TimeEntryContext] Error loading entries:", error);
        toast({
          title: "Error loading entries",
          description: "Your entries could not be loaded. Please try refreshing the page.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadEntries();
  }, [toast, isInitialized]);

  // Save entries when they change - with proper dependency array
  useEffect(() => {
    if (!isInitialized || isLoading) return; // Don't save during initial load
    
    try {
      console.debug("[TimeEntryContext] Saving entries to localStorage:", entries.length);
      localStorage.setItem('timeEntries', JSON.stringify(entries));
      console.debug("[TimeEntryContext] Saved entries to localStorage successfully");
    } catch (error) {
      console.error("[TimeEntryContext] Error saving entries to localStorage:", error);
    }
  }, [entries, isLoading, isInitialized]);

  // Filter entries for the selected day
  const dayEntries = useCallback(() => {
    if (!selectedDate || !userId) {
      console.debug("[TimeEntryContext] No selectedDate or userId, returning empty dayEntries");
      return [];
    }
    
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    console.debug("[TimeEntryContext] Filtering entries for date:", selectedDateStr, "userId:", userId);
    
    const filtered = entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      const entryDateStr = format(entryDate, "yyyy-MM-dd");
      const matches = entryDateStr === selectedDateStr && entry.userId === userId;
      
      if (matches) {
        console.debug("[TimeEntryContext] Matched entry:", entry.id, "hours:", entry.hours);
      }
      
      return matches;
    });
    
    console.debug("[TimeEntryContext] Found", filtered.length, "entries for date", selectedDateStr);
    return filtered;
  }, [entries, selectedDate, userId]);

  // Add a new entry
  const addEntry = useCallback((entryData: Omit<TimeEntry, "id">) => {
    console.debug("[TimeEntryContext] Adding new entry:", entryData);
    
    const newEntry: TimeEntry = {
      ...entryData,
      id: uuidv4(),
    };

    console.debug("[TimeEntryContext] Created entry with ID:", newEntry.id);
    
    setEntries(prev => {
      const newEntries = [...prev, newEntry];
      console.debug("[TimeEntryContext] Updated entries array, new length:", newEntries.length);
      return newEntries;
    });
    
    toast({
      title: "Entry added",
      description: `Added ${entryData.hours} hours to your timesheet`,
    });
  }, [toast]);

  // Update an existing entry
  const updateEntry = useCallback((entryId: string, updates: Partial<TimeEntry>) => {
    console.debug("[TimeEntryContext] Updating entry:", entryId, "with updates:", updates);
    
    setEntries(prev => {
      const entryIndex = prev.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        console.warn("[TimeEntryContext] Entry not found for update:", entryId);
        return prev;
      }
      
      const updatedEntries = [...prev];
      updatedEntries[entryIndex] = { ...updatedEntries[entryIndex], ...updates };
      
      console.debug("[TimeEntryContext] Entry updated successfully");
      return updatedEntries;
    });
    
    toast({
      title: "Entry updated",
      description: "Your time entry has been updated",
    });
  }, [toast]);

  // Delete an entry
  const deleteEntry = useCallback((entryId: string) => {
    console.debug("[TimeEntryContext] Attempting to delete entry:", entryId);
    
    setEntries(prev => {
      const entryToDelete = prev.find(entry => entry.id === entryId);
      if (!entryToDelete) {
        console.warn("[TimeEntryContext] Entry not found for deletion:", entryId);
        return prev;
      }
      
      const filteredEntries = prev.filter(entry => entry.id !== entryId);
      console.debug("[TimeEntryContext] Entry deleted, remaining entries:", filteredEntries.length);
      
      toast({
        title: "Entry deleted",
        description: "Time entry has been removed from your timesheet"
      });
      
      return filteredEntries;
    });
  }, [toast]);

  // Calculate total hours for the current day
  const calculateTotalHours = useCallback(() => {
    const total = dayEntries().reduce((sum, entry) => sum + (entry.hours || 0), 0);
    console.debug("[TimeEntryContext] Calculated total hours:", total);
    return total;
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
