import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useOffline } from '../hooks/useOffline';

export const OfflineIndicator: React.FC = () => {
  const { isOffline, isSyncing, lastSync, pendingSyncCount, syncError, triggerSync } = useOffline();

  if (!isOffline && pendingSyncCount === 0 && !isSyncing) {
    return null;
  }

  const getLastSyncText = () => {
    if (!lastSync) return 'Never synced';

    const now = Date.now();
    const diff = now - lastSync;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <View style={[styles.container, isOffline && styles.offlineContainer]}>
      <View style={styles.content}>
        {isOffline && (
          <View style={styles.statusRow}>
            <View style={styles.offlineDot} />
            <Text style={styles.statusText}>Offline Mode</Text>
          </View>
        )}

        {isSyncing && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.statusText}>Syncing...</Text>
          </View>
        )}

        {!isSyncing && pendingSyncCount > 0 && (
          <TouchableOpacity style={styles.statusRow} onPress={triggerSync} disabled={isOffline}>
            <Text style={styles.statusText}>
              {pendingSyncCount} pending change{pendingSyncCount > 1 ? 's' : ''}
            </Text>
            {!isOffline && <Text style={styles.syncButton}>Sync Now</Text>}
          </TouchableOpacity>
        )}

        {syncError && <Text style={styles.errorText}>{syncError}</Text>}

        {!isSyncing && lastSync && (
          <Text style={styles.lastSyncText}>Last sync: {getLastSyncText()}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  offlineContainer: {
    backgroundColor: '#FF9800',
  },
  content: {
    flexDirection: 'column',
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  syncButton: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginLeft: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
    fontStyle: 'italic',
  },
  lastSyncText: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.8,
  },
});
