import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OfflineIndicator } from './OfflineIndicator';
import { useOffline } from '../hooks/useOffline';

// Mock useOffline hook
jest.mock('../hooks/useOffline');

describe('OfflineIndicator', () => {
  const mockTriggerSync = jest.fn();
  const mockCheckConnection = jest.fn();

  const defaultOfflineState = {
    isOffline: false,
    isSyncing: false,
    lastSync: null,
    pendingSyncCount: 0,
    syncError: null,
    isInitialized: true,
    triggerSync: mockTriggerSync,
    checkConnection: mockCheckConnection,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useOffline as jest.Mock).mockReturnValue(defaultOfflineState);
  });

  describe('Visibility', () => {
    it('should not render when online with no pending changes', () => {
      const { container } = render(<OfflineIndicator />);

      expect(container.children.length).toBe(0);
    });

    it('should render when offline', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isOffline: true,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Offline Mode')).toBeTruthy();
    });

    it('should render when syncing', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isSyncing: true,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Syncing...')).toBeTruthy();
    });

    it('should render when there are pending changes', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        pendingSyncCount: 5,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('5 pending changes')).toBeTruthy();
    });
  });

  describe('Offline Status', () => {
    it('should show offline mode indicator', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isOffline: true,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Offline Mode')).toBeTruthy();
    });

    it('should apply offline styling when offline', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isOffline: true,
      });

      const { getByText } = render(<OfflineIndicator />);
      const container = getByText('Offline Mode').parent?.parent;

      expect(container?.props.style).toContainEqual(
        expect.objectContaining({ backgroundColor: expect.any(String) })
      );
    });
  });

  describe('Syncing Status', () => {
    it('should show syncing indicator', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isSyncing: true,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Syncing...')).toBeTruthy();
    });

    it('should show activity indicator when syncing', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isSyncing: true,
      });

      const { UNSAFE_getByType } = render(<OfflineIndicator />);
      const ActivityIndicator = require('react-native').ActivityIndicator;

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe('Pending Changes', () => {
    it('should show singular pending change text', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        pendingSyncCount: 1,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('1 pending change')).toBeTruthy();
    });

    it('should show plural pending changes text', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        pendingSyncCount: 5,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('5 pending changes')).toBeTruthy();
    });

    it('should show sync now button when online', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isOffline: false,
        pendingSyncCount: 3,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Sync Now')).toBeTruthy();
    });

    it('should not show sync now button when offline', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isOffline: true,
        pendingSyncCount: 3,
      });

      const { queryByText } = render(<OfflineIndicator />);

      expect(queryByText('Sync Now')).toBeNull();
    });

    it('should trigger sync when sync now is pressed', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isOffline: false,
        pendingSyncCount: 3,
      });

      const { getByText } = render(<OfflineIndicator />);
      const syncButton = getByText('Sync Now');

      fireEvent.press(syncButton);

      expect(mockTriggerSync).toHaveBeenCalled();
    });

    it('should not trigger sync when offline', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isOffline: true,
        pendingSyncCount: 3,
      });

      const { getByText } = render(<OfflineIndicator />);
      const pendingText = getByText('3 pending changes');

      fireEvent.press(pendingText);

      expect(mockTriggerSync).not.toHaveBeenCalled();
    });
  });

  describe('Sync Error', () => {
    it('should display sync error message', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        syncError: 'Network error occurred',
        pendingSyncCount: 1,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Network error occurred')).toBeTruthy();
    });

    it('should show error with offline status', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isOffline: true,
        syncError: 'Sync failed',
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Offline Mode')).toBeTruthy();
      expect(getByText('Sync failed')).toBeTruthy();
    });
  });

  describe('Last Sync Time', () => {
    it('should show "Never synced" when no last sync', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        lastSync: null,
        pendingSyncCount: 1,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Last sync: Never synced')).toBeTruthy();
    });

    it('should show "Just now" for recent sync', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        lastSync: Date.now() - 30000, // 30 seconds ago
        pendingSyncCount: 1,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Last sync: Just now')).toBeTruthy();
    });

    it('should show minutes ago', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        lastSync: Date.now() - 5 * 60000, // 5 minutes ago
        pendingSyncCount: 1,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Last sync: 5m ago')).toBeTruthy();
    });

    it('should show hours ago', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        lastSync: Date.now() - 3 * 3600000, // 3 hours ago
        pendingSyncCount: 1,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Last sync: 3h ago')).toBeTruthy();
    });

    it('should show days ago', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        lastSync: Date.now() - 2 * 86400000, // 2 days ago
        pendingSyncCount: 1,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Last sync: 2d ago')).toBeTruthy();
    });

    it('should not show last sync when syncing', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isSyncing: true,
        lastSync: Date.now() - 60000,
      });

      const { queryByText } = render(<OfflineIndicator />);

      expect(queryByText(/Last sync:/)).toBeNull();
    });
  });

  describe('Combined States', () => {
    it('should show offline and pending changes together', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isOffline: true,
        pendingSyncCount: 3,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Offline Mode')).toBeTruthy();
      expect(getByText('3 pending changes')).toBeTruthy();
    });

    it('should show syncing with last sync time', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isSyncing: true,
        lastSync: Date.now() - 60000,
      });

      const { getByText, queryByText } = render(<OfflineIndicator />);

      expect(getByText('Syncing...')).toBeTruthy();
      expect(queryByText(/Last sync:/)).toBeNull(); // Should not show during sync
    });

    it('should show error with pending changes', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        pendingSyncCount: 2,
        syncError: 'Connection timeout',
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('2 pending changes')).toBeTruthy();
      expect(getByText('Connection timeout')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero pending count correctly', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        pendingSyncCount: 0,
        isOffline: false,
      });

      const { container } = render(<OfflineIndicator />);

      expect(container.children.length).toBe(0);
    });

    it('should handle large pending count', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        pendingSyncCount: 999,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('999 pending changes')).toBeTruthy();
    });

    it('should handle very old last sync', () => {
      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        lastSync: Date.now() - 30 * 86400000, // 30 days ago
        pendingSyncCount: 1,
      });

      const { getByText } = render(<OfflineIndicator />);

      expect(getByText('Last sync: 30d ago')).toBeTruthy();
    });

    it('should update when offline state changes', () => {
      const { rerender, getByText, queryByText } = render(<OfflineIndicator />);

      expect(queryByText('Offline Mode')).toBeNull();

      (useOffline as jest.Mock).mockReturnValue({
        ...defaultOfflineState,
        isOffline: true,
      });

      rerender(<OfflineIndicator />);

      expect(getByText('Offline Mode')).toBeTruthy();
    });
  });
});
