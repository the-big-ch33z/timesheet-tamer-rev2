
import { AuditLog } from '@/types';

/**
 * Service for logging and retrieving audit events
 */
export const auditService = {
  /**
   * Log an audit event
   */
  logEvent: (
    userId: string,
    action: string,
    targetResource: string,
    details: string
  ): Promise<AuditLog> => {
    const auditLog: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      action,
      targetResource,
      details,
      ipAddress: window.location.hostname // In a real app, this would be the client IP
    };
    
    // Store audit log in localStorage for now
    // In a real app, this would be sent to a server
    const existingLogs = localStorage.getItem('auditLogs');
    const logs = existingLogs ? JSON.parse(existingLogs) : [];
    logs.push(auditLog);
    localStorage.setItem('auditLogs', JSON.stringify(logs));
    
    // Log to console for debugging
    console.log('Audit event logged:', auditLog);
    
    return Promise.resolve(auditLog);
  },
  
  /**
   * Get audit logs
   */
  getLogs: (): Promise<AuditLog[]> => {
    const logs = localStorage.getItem('auditLogs');
    return Promise.resolve(logs ? JSON.parse(logs) : []);
  },
  
  /**
   * Get audit logs for a specific user
   */
  getLogsByUser: (userId: string): Promise<AuditLog[]> => {
    const logs = localStorage.getItem('auditLogs');
    const parsedLogs = logs ? JSON.parse(logs) : [];
    return Promise.resolve(parsedLogs.filter((log: AuditLog) => log.userId === userId));
  },
  
  /**
   * Get audit logs for a specific resource
   */
  getLogsByResource: (resourceType: string): Promise<AuditLog[]> => {
    const logs = localStorage.getItem('auditLogs');
    const parsedLogs = logs ? JSON.parse(logs) : [];
    return Promise.resolve(
      parsedLogs.filter((log: AuditLog) => log.targetResource.startsWith(resourceType))
    );
  }
};
