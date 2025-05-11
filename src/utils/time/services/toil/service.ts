
import { TimeEntry, WorkSchedule } from "@/types";
import { createTimeLogger } from "../../errors/timeLogger";
import { TOILSummary } from "@/types/toil";
import { Holiday } from "@/lib/holidays";
import { 
  TOIL_RECORDS_KEY, 
  TOIL_USAGE_KEY, 
  TOIL_SUMMARY_CACHE_KEY 
} from "./types";

// Constants
export const TOIL_JOB_NUMBER = "TOIL";
export const TOIL_STORAGE_KEY = "toilData";

// Types
export interface TOILBalanceEntry {
  balance: number;
  accrued: number;
  used: number;
  lastUpdated: Date;
  timestamp?: number; // Added timestamp for sorting
}

export interface TOILUsageEntry {
  id: string;
  userId: string;
  date: Date;
  hours: number;
  approved?: boolean;
  approvedBy?: string;
  approvedDate?: Date;
  timestamp?: number; // Added timestamp for sorting
}

// Logger
const logger = createTimeLogger('TOILService');

/**
 * Service for handling Time Off In Lieu (TOIL) balance and transactions
 */
export class TOILService {
  private initialized = false;
  private cache: Map<string, any> = new Map();
  
  constructor() {}
  
  /**
   * Initialize the service
   */
  public init(): void {
    if (this.initialized) return;
    this.initialized = true;
    logger.debug('TOIL service initialized');
  }
  
  /**
   * Clear the cache for all TOIL data
   */
  public clearCache(): void {
    logger.debug('Clearing TOIL cache');
    this.cache.clear();
  }
  
  /**
   * Calculate TOIL balance for a user at a given date
   */
  public async calculateBalance(userId: string, date: Date = new Date()): Promise<TOILBalanceEntry> {
    try {
      // Get stored balance or create a new one
      const storedBalance = await this.getBalance(userId);
      
      return storedBalance || {
        balance: 0,
        accrued: 0,
        used: 0,
        lastUpdated: new Date(),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error calculating TOIL balance:', error);
      return {
        balance: 0,
        accrued: 0,
        used: 0,
        lastUpdated: new Date(),
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Get balance for a user from storage
   */
  public async getBalance(userId: string): Promise<TOILBalanceEntry> {
    try {
      const toilData = localStorage.getItem(TOIL_STORAGE_KEY);
      if (!toilData) return this.createDefaultBalance();
      
      const parsed = JSON.parse(toilData);
      const userBalance = parsed[userId];
      
      if (!userBalance) return this.createDefaultBalance();
      
      // Ensure the date is properly parsed
      return {
        ...userBalance,
        lastUpdated: new Date(userBalance.lastUpdated),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error getting TOIL balance:', error);
      return this.createDefaultBalance();
    }
  }
  
  /**
   * Create a default balance entry
   */
  private createDefaultBalance(): TOILBalanceEntry {
    return {
      balance: 0,
      accrued: 0,
      used: 0,
      lastUpdated: new Date(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Add an accrual entry to a user's TOIL balance
   */
  public async addAccrualEntry(entry: TimeEntry): Promise<boolean> {
    try {
      const { userId, hours } = entry;
      
      // Get current balance
      const balance = await this.getBalance(userId);
      
      // Update balance
      const updatedBalance = {
        balance: balance.balance + (hours || 0),
        accrued: balance.accrued + (hours || 0),
        used: balance.used,
        lastUpdated: new Date(),
        timestamp: Date.now()
      };
      
      // Save updated balance
      return this.saveBalance(userId, updatedBalance);
    } catch (error) {
      logger.error('Error adding TOIL accrual entry:', error);
      return false;
    }
  }
  
  /**
   * Process TOIL usage
   */
  public async processUsage(entry: TimeEntry): Promise<boolean> {
    try {
      const { userId, hours } = entry;
      
      // Get current balance
      const balance = await this.getBalance(userId);
      
      // Check if user has enough balance
      if (balance.balance < (hours || 0)) {
        logger.warn(`User ${userId} doesn't have enough TOIL balance`);
        return false;
      }
      
      // Update balance
      const updatedBalance = {
        balance: balance.balance - (hours || 0),
        accrued: balance.accrued,
        used: balance.used + (hours || 0),
        lastUpdated: new Date(),
        timestamp: Date.now()
      };
      
      // Save updated balance
      return this.saveBalance(userId, updatedBalance);
    } catch (error) {
      logger.error('Error processing TOIL usage:', error);
      return false;
    }
  }
  
  /**
   * Save balance to storage
   */
  private async saveBalance(userId: string, balance: TOILBalanceEntry): Promise<boolean> {
    try {
      // Get existing data
      const toilData = localStorage.getItem(TOIL_STORAGE_KEY);
      const existingData = toilData ? JSON.parse(toilData) : {};
      
      // Update with new balance
      const updatedData = {
        ...existingData,
        [userId]: balance
      };
      
      // Save to storage
      localStorage.setItem(TOIL_STORAGE_KEY, JSON.stringify(updatedData));
      
      return true;
    } catch (error) {
      logger.error('Error saving TOIL balance:', error);
      return false;
    }
  }
  
  /**
   * Calculate overtime hours based on schedule
   */
  public async calculateOvertimeHours(
    userId: string,
    date: Date,
    actualHours: number,
    workSchedule: any | null
  ): Promise<number> {
    // If no schedule, can't calculate overtime
    if (!workSchedule) return 0;
    
    try {
      // Simple overtime calculation for demo purposes
      // In a real implementation, this would use the schedule to determine standard hours
      const standardHours = 7.6; // Example standard hours
      
      // Only count hours above standard as overtime
      const overtime = Math.max(0, actualHours - standardHours);
      
      return overtime;
    } catch (error) {
      logger.error('Error calculating overtime:', error);
      return 0;
    }
  }
  
  /**
   * Get TOIL summary for a user and month
   */
  public getTOILSummary(userId: string, monthYear: string): TOILSummary {
    // Check cache first
    const cacheKey = `${userId}_${monthYear}_summary`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      // Default summary
      const defaultSummary: TOILSummary = {
        userId,
        monthYear,
        accrued: 0,
        used: 0,
        remaining: 0
      };
      
      // Get from localStorage
      const summaryJSON = localStorage.getItem(`${TOIL_SUMMARY_CACHE_KEY}_${userId}_${monthYear}`);
      if (!summaryJSON) {
        return defaultSummary;
      }
      
      const parsedSummary = JSON.parse(summaryJSON);
      
      // Cache the result
      this.cache.set(cacheKey, parsedSummary);
      
      return parsedSummary;
    } catch (error) {
      logger.error(`Error getting TOIL summary for ${userId}, ${monthYear}:`, error);
      return {
        userId,
        monthYear,
        accrued: 0,
        used: 0,
        remaining: 0
      };
    }
  }
  
  /**
   * Record TOIL usage
   */
  public async recordTOILUsage(entry: TimeEntry): Promise<boolean> {
    if (!entry || !entry.userId || !entry.id || typeof entry.hours !== 'number') {
      logger.error('Invalid entry for TOIL usage recording');
      return false;
    }
    
    try {
      // Implementation for recording TOIL usage
      logger.debug(`Recording TOIL usage: ${entry.hours} hours for user ${entry.userId}`);
      return true;
    } catch (error) {
      logger.error('Error recording TOIL usage:', error);
      return false;
    }
  }
  
  /**
   * Calculate and store TOIL information
   */
  public async calculateAndStoreTOIL(
    entries: TimeEntry[],
    date: Date,
    userId: string,
    workSchedule: WorkSchedule,
    holidays: Holiday[]
  ): Promise<TOILSummary | null> {
    try {
      logger.debug(`Calculating TOIL for ${userId} on ${date.toISOString()}`);
      
      // Simple implementation for now
      const summary = {
        userId,
        monthYear: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        accrued: 0,
        used: 0,
        remaining: 0
      };
      
      // Store in cache
      const cacheKey = `${userId}_${summary.monthYear}_summary`;
      this.cache.set(cacheKey, summary);
      
      // Store in localStorage for persistence
      localStorage.setItem(`${TOIL_SUMMARY_CACHE_KEY}_${userId}_${summary.monthYear}`, JSON.stringify(summary));
      
      return summary;
    } catch (error) {
      logger.error('Error calculating and storing TOIL:', error);
      return null;
    }
  }
}
