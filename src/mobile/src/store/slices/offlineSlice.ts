import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OfflineState {
  isOffline: boolean;
  isSyncing: boolean;
  lastSync: number | null;
  pendingSyncCount: number;
  syncError: string | null;
}

const initialState: OfflineState = {
  isOffline: false,
  isSyncing: false,
  lastSync: null,
  pendingSyncCount: 0,
  syncError: null,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOfflineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
    setSyncStatus: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setLastSync: (state, action: PayloadAction<number>) => {
      state.lastSync = action.payload;
    },
    setPendingSyncCount: (state, action: PayloadAction<number>) => {
      state.pendingSyncCount = action.payload;
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.syncError = action.payload;
    },
    resetOfflineState: (state) => {
      state.isSyncing = false;
      state.syncError = null;
    },
  },
});

export const {
  setOfflineStatus,
  setSyncStatus,
  setLastSync,
  setPendingSyncCount,
  setSyncError,
  resetOfflineState,
} = offlineSlice.actions;

export default offlineSlice.reducer;
