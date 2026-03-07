import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { offlineStorage } from '../storage/offlineStorage';

type NetworkStatusListener = (isOnline: boolean) => void;

class NetworkStatusService {
  private listeners: NetworkStatusListener[] = [];
  private isOnline: boolean = true;
  private unsubscribe: (() => void) | null = null;

  initialize(): void {
    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true && state.isInternetReachable === true;

      // Update offline mode in storage
      offlineStorage.setOfflineMode(!this.isOnline);

      // Notify listeners if status changed
      if (wasOnline !== this.isOnline) {
        this.notifyListeners(this.isOnline);
      }
    });
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected === true && state.isInternetReachable === true;
    return this.isOnline;
  }

  addListener(listener: NetworkStatusListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }
}

export const networkStatusService = new NetworkStatusService();
