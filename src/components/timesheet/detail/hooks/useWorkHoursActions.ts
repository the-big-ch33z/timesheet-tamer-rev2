
import { useCallback, useState, useEffect } from 'react';
import { WorkHoursActionType } from '../components/WorkHoursActionButtons';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

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

// Add debounce protection for TOIL events
let lastTOILEventTime = 0;
const DEBOUNCE_TIME = 500; // ms

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

  // New: Debounced event publisher for TOIL updates
  const publishToilEvent = useCallback((eventData: any) => {
    const now = Date.now();
    if (now - lastTOILEventTime < DEBOUNCE_TIME) {
      logger.debug('Skipping duplicate TOIL event due to debounce');
      return;
    }
    
    lastTOILEventTime = now;
    timeEventsService.publish('toil-updated', eventData);
    logger.debug('Published debounced TOIL event:', eventData);
  }, []);

  const createSyntheticEntry = useCallback(async (type: WorkHoursActionType, isActive: boolean, dayHours: number) => {
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
            
            // FIXED: Use debounced publisher for TOIL events
            if (type === 'toil') {
              publishToilEvent({
                userId,
                date: date.toISOString(),
                entryId,
                reset: true
              });
            }
            
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
      
      // Check for existing entries for the same day and type
      const existingForDay = dayEntries.find(entry => 
        entry.synthetic === true && 
        entry.jobNumber === entryTypeMap[type]
      );
      
      if (existingForDay) {
        logger.debug(`Found existing ${type} entry for today, using it:`, existingForDay);
        setSyntheticEntryIds(prev => ({ ...prev, [type]: existingForDay.id }));
        setActionStates(prev => ({ ...prev, [type]: true }));
        setCreatedEntries(prev => ({ ...prev, [type]: true }));
        return;
      }
      
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
          
          // FIXED: Use debounced publisher for TOIL events
          if (type === 'toil') {
            publishToilEvent({
              userId,
              date: date.toISOString(),
              entryId: newEntryId,
              hours: hoursToRecord
            });
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
  }, [date, userId, createEntry, deleteEntry, syntheticEntryIds, toast, dayEntries, publishToilEvent]);

  const handleToggleAction = useCallback((type: WorkHoursActionType, dayHours: number) => {
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
        setTimeout(() => {
          createSyntheticEntry(type, next[type], dayHours);
        }, 0);
      }
      
      return next;
    });
  }, [createSyntheticEntry]);

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
