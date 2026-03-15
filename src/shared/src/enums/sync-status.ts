/**
 * Sync status enum for offline-first architecture
 * Used across backend, frontend, and mobile platforms
 */
export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  CONFLICT = 'conflict',
}
