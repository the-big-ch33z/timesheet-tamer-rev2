
import { TimeEntry } from '@/types';

export interface UseTOILEntryCheckerResult {
  isToilEntry: (entry: TimeEntry) => boolean;
}
