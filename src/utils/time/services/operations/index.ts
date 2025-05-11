
import { TimeEntryOperationsConfig } from './types';
import { EventManager } from '../event-handling';
import { TimeEntry } from '@/types';
import { UpdateOperations } from './update-operations';
import { ReadOperations } from './read-operations';
import { DeleteOperations } from './delete-operations';
import { CreateOperations } from './create-operations';

export { TimeEntryOperationsConfig } from './types';

export class TimeEntryOperations {
  public create: CreateOperations;
  public read: ReadOperations;
  public update: UpdateOperations;
  public delete: DeleteOperations;
  
  constructor(
    config: Required<TimeEntryOperationsConfig>,
    invalidateCache: () => void,
    getAllEntries: () => TimeEntry[],
    eventManager: EventManager
  ) {
    this.create = new CreateOperations(config, invalidateCache, getAllEntries, eventManager);
    this.read = new ReadOperations(config, getAllEntries);
    this.update = new UpdateOperations(config, invalidateCache, getAllEntries, eventManager);
    this.delete = new DeleteOperations(config, invalidateCache, getAllEntries, eventManager);
  }
}
