
import { useCallback, useState, useEffect, useRef } from 'react';
import { WorkHoursActionType } from '../components/WorkHoursActionButtons';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { useDebounce } from '@/hooks/useDebounce';
// Import cleanup function directly from queries to avoid circular references
import { cleanupDuplicateToilUsage } from '@/utils/time/services/toil/storage/queries';

const logger = createTimeLogger('useWorkHoursActions');

export type SyntheticEntryIds = Record<WorkHoursActionType, string | null>;
export type ActionStates = Record<WorkHoursActionType, boolean>;
export type CreatedEntries = Record<WorkHoursActionType, boolean>;

const INITIAL_STATES = {
  sick: false,
  leave: false,
  toil: false,
  lunch: false,
  smoko: false
};

export const useWorkHoursActions = (date: Date, userId: string) => {
  const { createEntry, deleteEntry, dayEntries } = useTimeEntryContext();
  const { toast } = useToast();
  
  const [actionStates, setActionStates] = useState<ActionStates>(INITIAL_STATES);
  const [createdEntries, setCreatedEntries] = useState<CreatedEntries>(INITIAL_STATES);
  const [syntheticEntryIds, setSyntheticEntryIds] = useState<SyntheticEntryIds>({
    sick: null,
    leave: null,
    toil: null,
    lunch: null,
    smoko: null
  });
  
  // Add processing state refs to prevent duplicate operations
  const processingRef = useRef<Record<WorkHoursActionType, boolean>>({
    sick: false,
    leave: false,
    toil: false,
    lunch: false,
    smoko: false
  });

  // Effect to initialize state from existing entries
  useEffect(() => {
    // Look for synthetic entries that exist in the current day's entries
    const toilEntry = dayEntries.find(entry => 
      entry.synthetic === true && 
      entry.jobNumber === "TOIL"
    );
    
    const sickEntry = dayEntries.find(entry => 
      entry.synthetic === true && 
      entry.jobNumber === "SICK"
    );
    
    const leaveEntry = dayEntries.find(entry => 
      entry.synthetic === true && 
      entry.jobNumber === "LEAVE"
    );
    
    // Update our state to match existing entries
    setActionStates(prev => ({
      ...prev,
      toil: !!toilEntry,
      sick: !!sickEntry,
      leave: !!leaveEntry
    }));
    
    // Update synthetic entry IDs
    setSyntheticEntryIds(prev => ({
      ...prev,
      toil: toilEntry?.id || null,
      sick: sickEntry?.id || null,
      leave: leaveEntry?.id || null
    }));
    
    // Update created entries state
    setCreatedEntries(prev => ({
      ...prev,
      toil: !!toilEntry,
      sick: !!sickEntry,
      leave: !!leaveEntry
    }));
    
  }, [dayEntries]);

  // Debounced implementation of createSyntheticEntry
  const createSyntheticEntry = useDebounce(async (type: WorkHoursActionType, isActive: boolean, dayHours: number) => {
    // If already processing this type, skip to prevent duplicates
    if (processingRef.current[type]) {
      logger.debug(`Already processing ${type}, skipping duplicate operation`);
      return;
    }
    
    // Set processing flag
    processingRef.current[type] = true;
    
    try {
      logger.debug(`${type} toggle state changed to: ${isActive ? 'active' : 'inactive'}`);

      // Handle toggling OFF - this needs to properly delete the entry
      if (!isActive) {
        const entryId = syntheticEntryIds[type];
        
        if (entryId) {
          logger.debug(`Attempting to delete synthetic entry: ${entryId} for type: ${type}`);
          
          try {
            // Before deleting, double-check if the entry still exists
            const entryExists = dayEntries.some(entry => entry.id === entryId);
            
            if (!entryExists) {
              logger.debug(`Entry ${entryId} no longer exists in dayEntries, updating state only`);
              setSyntheticEntryIds(prev => ({ ...prev, [type]: null }));
              setActionStates(prev => ({ ...prev, [type]: false }));
              setCreatedEntries(prev => ({ ...prev, [type]: false }));
              return;
            }
            
            const success = await deleteEntry(entryId);
            
            if (success) {
              logger.debug(`Successfully deleted synthetic entry: ${entryId}`);
              setSyntheticEntryIds(prev => ({ ...prev, [type]: null }));
              setActionStates(prev => ({ ...prev, [type]: false }));
              setCreatedEntries(prev => ({ ...prev, [type]: false }));
              
              timeEventsService.publish('toil-updated', {
                userId,
                date: date.toISOString(),
                entryId,
                reset: true
              });
              
              toast({
                title: `${type.charAt(0).toUpperCase() + type.slice(1)} Removed`,
                description: `Entry removed from ${date.toLocaleDateString()}`
              });
            } else {
              logger.error(`Failed to delete synthetic entry: ${entryId}`);
              // Make sure we still update the UI state since deletion failed
              setActionStates(prev => ({ ...prev, [type]: false }));
              toast({
                title: `Removal Error`,
                description: `Could not remove ${type} entry. Please try again.`,
                variant: "destructive"
              });
            }
          } catch (error) {
            logger.error(`Error deleting synthetic entry: ${entryId}`, error);
            setActionStates(prev => ({ ...prev, [type]: false }));
            toast({
              title: `Removal Error`,
              description: `Could not remove ${type} entry due to an unexpected error.`,
              variant: "destructive"
            });
          }
        } else {
          // No entry ID found but the state thinks it's active - fix the state
          logger.debug(`No entry ID found for ${type}, but state was active. Fixing state.`);
          setActionStates(prev => ({ ...prev, [type]: false }));
          setCreatedEntries(prev => ({ ...prev, [type]: false }));
        }
        return;
      }

      // Don't create duplicate entries
      if (syntheticEntryIds[type]) {
        logger.debug(`Synthetic entry already exists for ${type}, not creating another one`);
        return;
      }
      
      // TOIL-specific check: Check if we already have a TOIL entry for this day
      if (type === 'toil') {
        const existingToilEntry = dayEntries.find(entry => 
          entry.jobNumber === "TOIL"
        );
        
        if (existingToilEntry) {
          logger.debug(`TOIL entry already exists for this day: ${existingToilEntry.id}, updating state to match`);
          setSyntheticEntryIds(prev => ({ ...prev, [type]: existingToilEntry.id }));
          setCreatedEntries(prev => ({ ...prev, [type]: true }));
          setActionStates(prev => ({ ...prev, [type]: true }));
          return;
        }
      }

      // Calculate the correct hours for the entry
      // For TOIL, always include the smoko break time (0.25 hours)
      let hoursToRecord = dayHours > 0 ? dayHours : 7.6;
      
      // For TOIL specifically, ensure we use the standard day hours
      if (type === 'toil') {
        // Base standard day is 8.75 hours (with 0.5h lunch and 0.25h smoko)
        hoursToRecord = 9.0; // Include the smoko break (0.25 hours)
        logger.debug(`Using standard TOIL hours: ${hoursToRecord}`);
      }
      
      const entryTypeMap = {
        leave: "LEAVE",
        sick: "SICK",
        toil: "TOIL"
      } as const;
      
      if (type === 'leave' || type === 'sick' || type === 'toil') {
        logger.debug(`Creating synthetic ${type} entry with ${hoursToRecord} hours for ${date.toLocaleDateString()}`);
        
        const entryData = {
          userId,
          date,
          hours: hoursToRecord,
          entryType: "auto",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} - Automatically generated`,
          jobNumber: entryTypeMap[type],
          project: "General",
          synthetic: true
        };
        
        try {
          const newEntryId = createEntry(entryData);
          
          if (newEntryId) {
            logger.debug(`Successfully created synthetic ${type} entry: ${newEntryId}`);
            setSyntheticEntryIds(prev => ({ ...prev, [type]: newEntryId }));
            setCreatedEntries(prev => ({ ...prev, [type]: true }));
            
            // Publish TOIL update event for UI refresh
            if (type === 'toil') {
              // Add a small delay before publishing to ensure the entry is fully created
              setTimeout(() => {
                timeEventsService.publish('toil-updated', {
                  userId,
                  date: date.toISOString(),
                  entryId: newEntryId,
                  hours: hoursToRecord
                });
              }, 100);
            }
            
            toast({
              title: `${type.charAt(0).toUpperCase() + type.slice(1)} Recorded`,
              description: `${hoursToRecord} hours ${type === 'toil' ? 'used from' : 'recorded for'} ${date.toLocaleDateString()}`
            });
          } else {
            logger.error(`Failed to create synthetic ${type} entry`);
            setActionStates(prev => ({ ...prev, [type]: false }));
            toast({
              title: `Creation Error`,
              description: `Could not create ${type} entry. Please try again.`,
              variant: "destructive"
            });
          }
        } catch (error) {
          logger.error(`Error creating synthetic ${type} entry`, error);
          setActionStates(prev => ({ ...prev, [type]: false }));
          toast({
            title: `Creation Error`,
            description: `Could not create ${type} entry due to an unexpected error.`,
            variant: "destructive"
          });
        }
      }
    } finally {
      // Clear processing flag after a short delay to prevent rapid double-clicks
      setTimeout(() => {
        processingRef.current[type] = false;
      }, 300);
    }
  }, 300);

  const handleToggleAction = useCallback((type: WorkHoursActionType, dayHours: number) => {
    // Prevent toggling if already processing
    if (processingRef.current[type]) {
      logger.debug(`Skipping toggle for ${type} - already processing`);
      return;
    }
    
    setActionStates(prev => {
      let next = { ...prev, [type]: !prev[type] };
      
      // Ensure only one of these can be active at a time
      if (type === "leave" && next.leave) {
        next.sick = false;
        next.toil = false;
      }
      if (type === "sick" && next.sick) {
        next.leave = false;
        next.toil = false;
      }
      if (type === "toil" && next.toil) {
        next.leave = false;
        next.sick = false;
      }
      
      if ((type === "leave" || type === "sick" || type === "toil") && next[type] !== prev[type]) {
        // Use setTimeout to avoid state update issues
        createSyntheticEntry(type, next[type], dayHours);
      }
      
      return next;
    });
  }, [createSyntheticEntry]);

  // Add a function to run cleanup at component mount
  useEffect(() => {
    // Clean up any duplicate TOIL usage records on mount
    if (userId) {
      // Direct function call to cleanup from queries module
      cleanupDuplicateToilUsage(userId)
        .then(count => {
          if (count > 0) {
            logger.debug(`Cleaned up ${count} duplicate TOIL usage records at mount`);
          }
        })
        .catch(err => {
          logger.error('Error cleaning up duplicate TOIL usage:', err);
        });
    }
  }, [userId]);

  return {
    actionStates,
    createdEntries,
    syntheticEntryIds,
    handleToggleAction,
    setActionStates,
    setCreatedEntries,
    setSyntheticEntryIds
  };
};
