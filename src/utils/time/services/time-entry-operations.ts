
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
    config: TimeEntryOperationsConfig,
    private invalidateCache: () => void,
    private getAllEntries: () => TimeEntry[],
    private eventManager: EventManager
  ) {
    // Initialize with correct parameters order
    // Pass eventManager first, then the config to match the constructor signature
    this.createOps = new CreateOperations(this.eventManager, config);
    this.updateOps = new UpdateOperations(config, this.invalidateCache, this.getAllEntries, this.eventManager);
    this.deleteOps = new DeleteOperations(this.eventManager, config);
    
    console.log("[TimeEntryOperations] Initialized with config:", {
      serviceName: config.serviceName || 'default',
      storageKey: config.storageKey
    });
  }

  public createEntry(entryData: Omit<TimeEntry, "id">, deletedEntryIds: string[]): string | null {
    // Call createEntry on CreateOperations
    const newEntryId = this.createOps.createEntry(entryData, deletedEntryIds);
    if (newEntryId) {
      // Invalidate cache after successful creation
      this.invalidateCache();
      return newEntryId;
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
    // Call deleteEntry on DeleteOperations
    const result = await this.deleteOps.deleteEntry(entryId, deletedEntryIds);
    if (result) {
      // Invalidate cache after successful deletion
      this.invalidateCache();
    }
    return result;
  }
}
