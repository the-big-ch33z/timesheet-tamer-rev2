
import React, { createContext, useContext, useState, useEffect } from 'react';
import { TimeEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Define the context type
interface DraftContextType {
  draftEntry: Partial<TimeEntry> | null;
  saveDraft: (entry: Partial<TimeEntry>) => void;
  clearDraft: () => void;
  hasDraft: boolean;
  isDraftValid: boolean;
}

// Create the context
const DraftContext = createContext<DraftContextType | undefined>(undefined);

// Storage key for the draft
const DRAFT_STORAGE_KEY = 'timesheet-draft-entry';

export const useDraftContext = () => {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDraftContext must be used within a DraftProvider');
  }
  return context;
};

interface DraftProviderProps {
  children: React.ReactNode;
  selectedDate: Date;
  userId?: string;
}

export const DraftProvider: React.FC<DraftProviderProps> = ({ 
  children, 
  selectedDate,
  userId 
}) => {
  const [draftEntry, setDraftEntry] = useState<Partial<TimeEntry> | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const { toast } = useToast();

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        // Only restore draft if it's for current date and user
        if (parsedDraft && 
            parsedDraft.date && 
            new Date(parsedDraft.date).toDateString() === selectedDate.toDateString() &&
            parsedDraft.userId === userId) {
          console.debug("[DraftContext] Restored draft from storage", parsedDraft);
          setDraftEntry(parsedDraft);
          setHasDraft(true);
        } else {
          console.debug("[DraftContext] Found draft but it's for a different date/user");
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("[DraftContext] Error loading draft:", error);
    }
  }, [selectedDate, userId]);

  // Save draft to localStorage
  const saveDraft = (entry: Partial<TimeEntry>) => {
    try {
      // Ensure we have date and userId
      const draftToSave = {
        ...entry,
        date: selectedDate,
        userId: userId || ''
      };
      
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftToSave));
      setDraftEntry(draftToSave);
      setHasDraft(true);
      
      console.debug("[DraftContext] Saved draft to storage", draftToSave);
      
      toast({
        title: "Draft saved",
        description: "Your timesheet entry has been saved as a draft.",
      });
    } catch (error) {
      console.error("[DraftContext] Error saving draft:", error);
      toast({
        title: "Error saving draft",
        description: "There was a problem saving your draft.",
        variant: "destructive"
      });
    }
  };

  // Clear the draft from localStorage
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraftEntry(null);
      setHasDraft(false);
      console.debug("[DraftContext] Cleared draft from storage");
    } catch (error) {
      console.error("[DraftContext] Error clearing draft:", error);
    }
  };

  // Check if draft has minimum required fields
  const isDraftValid = draftEntry !== null && typeof draftEntry.hours === 'number' && draftEntry.hours > 0;

  const value = {
    draftEntry,
    saveDraft,
    clearDraft,
    hasDraft,
    isDraftValid
  };

  return (
    <DraftContext.Provider value={value}>
      {children}
    </DraftContext.Provider>
  );
};
