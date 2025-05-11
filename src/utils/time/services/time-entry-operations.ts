
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
    private invalidateCache: () => void,
    private getAllEntries: () => TimeEntry[],
    private eventManager: EventManager
  ) {
    // Initialize with correct parameters
    this.createOps = new CreateOperations(this.eventManager, config);
    this.updateOps = new UpdateOperations(this.eventManager, config);
    this.deleteOps = new DeleteOperations(this.eventManager, config);
  }

  public createEntry(entryData: Omit<TimeEntry, "id">, deletedEntryIds: string[]): string | null {
    // Call createNewEntry and return the ID
    const newEntry = this.createOps.createNewEntry(entryData);
    if (newEntry && newEntry.id) {
      // Invalidate cache after successful creation
      this.invalidateCache();
      return newEntry.id;
    }
    return null;
  }

  public updateEntry(entryId: string, updates: Partial<TimeEntry>, deletedEntryIds: string[]): boolean {
    // We need to implement this method since it's required by TimeEntryBaseOperations
    // For now, return false to indicate it's not implemented
    console.error("[TimeEntryOperations] updateEntry not implemented");
    return false;
  }

  public async deleteEntry(entryId: string, deletedEntryIds: string[]): Promise<boolean> {
    // Call deleteEntryById and return the result
    const result = await this.deleteOps.deleteEntryById(entryId);
    if (result) {
      // Invalidate cache after successful deletion
      this.invalidateCache();
    }
    return result;
  }
}
