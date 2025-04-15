
import { WorkSchedule } from '@/types';

// Default work schedule with two-week rotation
export const defaultWorkSchedule: WorkSchedule = {
  id: 'default',
  name: 'Default Schedule',
  userId: 'system', // Add missing userId property
  weeks: {
    1: {
      monday: { startTime: '09:00', endTime: '17:00' },
      tuesday: { startTime: '09:00', endTime: '17:00' },
      wednesday: { startTime: '09:00', endTime: '17:00' },
      thursday: { startTime: '09:00', endTime: '17:00' },
      friday: { startTime: '09:00', endTime: '17:00' },
      saturday: null,
      sunday: null
    },
    2: {
      monday: { startTime: '09:00', endTime: '17:00' },
      tuesday: { startTime: '09:00', endTime: '17:00' },
      wednesday: { startTime: '09:00', endTime: '17:00' },
      thursday: { startTime: '09:00', endTime: '17:00' },
      friday: { startTime: '09:00', endTime: '17:00' },
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
