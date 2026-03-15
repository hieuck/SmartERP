import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export enum ConflictResolution {
  KEEP_LOCAL = 'keep_local',
  KEEP_SERVER = 'keep_server',
  MERGE = 'merge',
}

export interface Conflict {
  id: string;
  entity: string;
  localData: any;
  serverData: any;
  localVersion: number;
  serverVersion: number;
}

export class ConflictResolver {
  /**
   * Resolve conflict with chosen strategy
   */
  async resolve(
    token: string,
    conflictId: string,
    resolution: ConflictResolution,
    mergedData?: any
  ): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/api/sync/resolve`,
      {
        conflictId,
        resolution,
        mergedData,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  /**
   * Auto-resolve conflicts using predefined rules
   */
  autoResolve(conflict: Conflict): ConflictResolution {
    // Simple rule: server always wins for now
    // Can be enhanced with field-level merging
    return ConflictResolution.KEEP_SERVER;
  }

  /**
   * Merge two versions field by field
   */
  merge(local: any, server: any): any {
    // Simple merge: take non-null values from both
    const merged = { ...server };
    
    for (const key in local) {
      if (local[key] !== null && local[key] !== undefined) {
        // If server value is null/undefined, use local
        if (server[key] === null || server[key] === undefined) {
          merged[key] = local[key];
        }
      }
    }
    
    return merged;
  }
}

// Export singleton instance
export const conflictResolver = new ConflictResolver();
