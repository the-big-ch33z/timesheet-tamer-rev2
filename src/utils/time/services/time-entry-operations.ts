
import { TimeEntry } from "@/types";
import { TimeEntryOperationsConfig, TimeEntryBaseOperations } from "./operations/types";
import { CreateOperations } from "./operations/create-operations";
import { UpdateOperations } from "./operations/update-operations";
import { DeleteOperations } from "./operations/delete-operations";
import { EventManager } from "./event-handling";

export class TimeEntryOperations implements TimeEntryBaseOperations {
  private createOps: CreateOperations;
  private updateOps: UpdateOperations;
  private deleteOps: DeleteOperations;

  constructor(
    config: Required<TimeEntryOperationsConfig>,
    invalidateCache: () => void,
    getAllEntries: () => TimeEntry[],
    eventManager: EventManager
  ) {
    this.createOps = new CreateOperations(config, invalidateCache, getAllEntries, eventManager);
    this.updateOps = new UpdateOperations(config, invalidateCache, getAllEntries, eventManager);
    this.deleteOps = new DeleteOperations(config, invalidateCache, getAllEntries, eventManager);
  }

  public createEntry(entryData: Omit<TimeEntry, "id">, deletedEntryIds: string[]): string | null {
    return this.createOps.createEntry(entryData, deletedEntryIds);
  }

  public updateEntry(entryId: string, updates: Partial<TimeEntry>, deletedEntryIds: string[]): boolean {
    return this.updateOps.updateEntry(entryId, updates, deletedEntryIds);
  }

  public deleteEntry(entryId: string, deletedEntryIds: string[]): boolean {
    return this.deleteOps.deleteEntry(entryId, deletedEntryIds);
  }
}
