
import { useCallback, useState } from 'react';
import { WorkHoursActionType } from '../components/WorkHoursActionButtons';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors';

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
  const { createEntry, deleteEntry } = useTimeEntryContext();
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

  const createSyntheticEntry = useCallback(async (type: WorkHoursActionType, isActive: boolean, dayHours: number) => {
    logger.debug(`${type} toggle state changed to: ${isActive ? 'active' : 'inactive'}`);

    // Handle toggling OFF - this needs to properly delete the entry
    if (!isActive) {
      const entryId = syntheticEntryIds[type];
      if (entryId) {
        logger.debug(`Attempting to delete synthetic entry: ${entryId} for type: ${type}`);
        
        try {
          const success = await deleteEntry(entryId);
          if (success) {
            logger.debug(`Successfully deleted synthetic entry: ${entryId}`);
            setSyntheticEntryIds(prev => ({ ...prev, [type]: null }));
            setActionStates(prev => ({ ...prev, [type]: false }));
            setCreatedEntries(prev => ({ ...prev, [type]: false }));
            
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
    
    // For TOIL specifically, add smoko time if not already included
    if (type === 'toil' && hoursToRecord < 9 && hoursToRecord >= 8.5) {
      // If the day is close to 8.75 hours, it likely doesn't include smoko
      hoursToRecord = 9.0; // Include the smoko break (0.25 hours)
      logger.debug(`Adjusted TOIL hours to include smoko break: ${hoursToRecord}`);
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
  }, [date, userId, createEntry, deleteEntry, syntheticEntryIds, toast]);

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
