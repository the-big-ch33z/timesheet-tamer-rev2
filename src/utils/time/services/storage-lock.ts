
import { createTimeLogger } from '../errors/timeLogger';

const logger = createTimeLogger('StorageLock');

// Write lock mechanism
let writeInProgress = false;
let writeQueue: (() => Promise<void>)[] = [];

export const storageWriteLock = {
  acquire: async (): Promise<boolean> => {
    if (writeInProgress) {
      return new Promise<boolean>(resolve => {
        const queuedWrite = async () => {
          resolve(true);
        };
        writeQueue.push(queuedWrite);
      });
    }
    
    writeInProgress = true;
    return true;
  },
  
  release: (): void => {
    writeInProgress = false;
    
    if (writeQueue.length > 0) {
      const nextWrite = writeQueue.shift();
      if (nextWrite) {
        writeInProgress = true;
        nextWrite().catch(error => {
          logger.error("Error in queued write:", error);
          storageWriteLock.release();
        });
      }
    }
  }
};
