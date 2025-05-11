
import { TimeEntry } from "@/types";
import { createTimeLogger } from "../../errors/timeLogger";

// Constants
export const TOIL_JOB_NUMBER = "TOIL";
export const TOIL_STORAGE_KEY = "toilData";

// Types
export interface TOILBalanceEntry {
  balance: number;
  accrued: number;
  used: number;
  lastUpdated: Date;
}

export interface TOILUsageEntry {
  id: string;
  userId: string;
  date: Date;
  hours: number;
  approved?: boolean;
  approvedBy?: string;
  approvedDate?: Date;
}

// Logger
const logger = createTimeLogger('TOILService');

/**
 * Service for handling Time Off In Lieu (TOIL) balance and transactions
 */
export class TOILService {
  private initialized = false;
  
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
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error calculating TOIL balance:', error);
      return {
        balance: 0,
        accrued: 0,
        used: 0,
        lastUpdated: new Date()
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
        lastUpdated: new Date(userBalance.lastUpdated)
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
      lastUpdated: new Date()
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
        lastUpdated: new Date()
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
        lastUpdated: new Date()
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
}
