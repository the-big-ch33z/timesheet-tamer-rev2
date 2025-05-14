
import { WorkSchedule } from '@/types';

// Default work schedule with two-week rotation
export const defaultWorkSchedule: WorkSchedule = {
  id: 'default',
  name: 'Default Schedule',
  userId: 'system', 
  weeks: {
    1: {
      monday: { startTime: '', endTime: '' },
      tuesday: { startTime: '', endTime: '' },
      wednesday: { startTime: '', endTime: '' },
      thursday: { startTime: '', endTime: '' },
      friday: { startTime: '', endTime: '' },
      saturday: null,
      sunday: null
    },
    2: {
      monday: { startTime: '', endTime: '' },
      tuesday: { startTime: '', endTime: '' },
      wednesday: { startTime: '', endTime: '' },
      thursday: { startTime: '', endTime: '' },
      friday: { startTime: '', endTime: '' },
      saturday: null,
      sunday: null
    }
  },
  rdoDays: {
    1: [],
    2: []
  },
  isDefault: true
};
