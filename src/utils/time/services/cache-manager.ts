
import { TimeEntry } from "@/types";
import { createTimeLogger } from "../errors/timeLogger";

const logger = createTimeLogger('CacheManager');

export interface EntryCache {
  entries: TimeEntry[];
  userEntries: Record<string, TimeEntry[]>;
  dayEntries: Record<string, TimeEntry[]>; 
  monthEntries: Record<string, TimeEntry[]>;
  timestamp: number;
  isValid: boolean;
}

export class CacheManager {
  private cache: EntryCache;
  private config: { enableCaching: boolean; cacheTTL: number };

  constructor(config: { enableCaching: boolean; cacheTTL: number }) {
    this.config = config;
    this.cache = this.createEmptyCache();
  }

  private createEmptyCache(): EntryCache {
    return {
      entries: [],
      userEntries: {},
      dayEntries: {},
      monthEntries: {},
      timestamp: 0,
      isValid: false
    };
  }

  public isValid(): boolean {
    if (!this.config.enableCaching) return false;
    if (!this.cache.isValid) return false;
    
    const now = Date.now();
    return (now - this.cache.timestamp) < this.config.cacheTTL;
  }

  public invalidate(): void {
    this.cache = {
      ...this.cache,
      isValid: false,
      timestamp: 0,
      userEntries: {},
      dayEntries: {},
      monthEntries: {}
    };
  }

  public updateEntries(entries: TimeEntry[]): void {
    this.cache = {
      ...this.cache,
      entries: [...entries],
      timestamp: Date.now(),
      isValid: true
    };
  }

  public getEntries(): TimeEntry[] {
    return this.isValid() ? [...this.cache.entries] : [];
  }

  public getUserEntries(userId: string): TimeEntry[] | null {
    return this.cache.userEntries[userId] ? [...this.cache.userEntries[userId]] : null;
  }

  public setUserEntries(userId: string, entries: TimeEntry[]): void {
    this.cache.userEntries[userId] = entries;
  }

  public getDayEntries(cacheKey: string): TimeEntry[] | null {
    return this.cache.dayEntries[cacheKey] ? [...this.cache.dayEntries[cacheKey]] : null;
  }

  public setDayEntries(cacheKey: string, entries: TimeEntry[]): void {
    this.cache.dayEntries[cacheKey] = entries;
  }

  public getMonthEntries(cacheKey: string): TimeEntry[] | null {
    return this.cache.monthEntries[cacheKey] ? [...this.cache.monthEntries[cacheKey]] : null;
  }

  public setMonthEntries(cacheKey: string, entries: TimeEntry[]): void {
    this.cache.monthEntries[cacheKey] = entries;
  }
}
