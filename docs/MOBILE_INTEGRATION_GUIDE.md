# Mobile Integration Guide

**Version:** 1.0  
**Last Updated:** 2026-03-15

---

## Overview

SmartERP mobile app (React Native) integrates with backend API and implements offline-first architecture.

**Platform:** React Native + TypeScript + Redux
**Backend:** NestJS REST API
**Offline:** SQLite + TypeORM + Sync Manager

---

## Architecture

```
Mobile App (React Native)
    ↓
Redux Store (State Management)
    ↓
Services Layer (API + Offline)
    ↓
SQLite Database (Local Storage)
    ↓
Sync Manager (Conflict Resolution)
    ↓
Backend API (NestJS)
```

---

## Setup

### 1. Install Dependencies

```bash
cd src/mobile
npm install
```

### 2. Configure Environment

```bash
# .env
API_URL=https://api.smarterp.com
API_TIMEOUT=30000
SYNC_INTERVAL=300000  # 5 minutes
```

### 3. Run App

```bash
# iOS
npm run ios

# Android
npm run android
```

---

## Mobile-Backend Integration

### 1. API Service

Location: `src/mobile/src/services/api.service.ts`

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  private baseURL = process.env.API_URL;
  
  async request(config: AxiosRequestConfig) {
    const token = await AsyncStorage.getItem('token');
    
    return axios({
      ...config,
      baseURL: this.baseURL,
      headers: {
        ...config.headers,
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  }
}
```

### 2. Authentication Flow

```typescript
// Login
const response = await api.post('/auth/login', {
  email,
  password,
});

await AsyncStorage.setItem('token', response.data.token);
await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

// Logout
await AsyncStorage.removeItem('token');
await AsyncStorage.removeItem('user');
```

---

## Offline-First Implementation

### 1. Database Setup (SQLite + TypeORM)

Location: `src/mobile/src/lib/offline/db.ts`

```typescript
import { DataSource } from 'typeorm';
import { Product } from '../entities/Product';
import { Customer } from '../entities/Customer';

export const mobileDataSource = new DataSource({
  type: 'react-native',
  database: 'smarterp.db',
  location: 'default',
  entities: [Product, Customer],
  synchronize: true,
  logging: false,
});

export const initDatabase = async () => {
  await mobileDataSource.initialize();
};
```

### 2. Offline Service Pattern

```typescript
// src/mobile/src/services/product-offline.service.ts
export class ProductOfflineService {
  private repository = mobileDataSource.getRepository(Product);

  async getAll(): Promise<Product[]> {
    return this.repository.find();
  }

  async create(product: Product): Promise<Product> {
    product.syncStatus = SyncStatus.PENDING;
    product.lastSyncedAt = new Date();
    return this.repository.save(product);
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.repository.findOne({ where: { id } });
    Object.assign(product, data);
    product.syncStatus = SyncStatus.PENDING;
    return this.repository.save(product);
  }
}
```

### 3. Sync Manager

Location: `src/mobile/src/lib/offline/sync-manager.ts`

```typescript
import NetInfo from '@react-native-community/netinfo';

export class MobileSyncManager {
  async syncAll(): Promise<void> {
    const isConnected = await this.checkConnection();
    
    if (!isConnected) {
      console.log('Offline - sync skipped');
      return;
    }

    await this.syncProducts();
    await this.syncCustomers();
    await this.syncOrders();
  }

  private async syncPro
ducts(): Promise<void> {
    const pendingProducts = await this.productOfflineService.getPending();
    
    for (const product of pendingProducts) {
      try {
        await this.api.post('/products/sync', product);
        await this.productOfflineService.markAsSynced(product.id);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }

  private async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected;
  }
}
```

---

## Network Detection

```typescript
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
};
```

---

## Background Sync

```typescript
import BackgroundFetch from 'react-native-background-fetch';

export const setupBackgroundSync = () => {
  BackgroundFetch.configure({
    minimumFetchInterval: 15, // minutes
    stopOnTerminate: false,
    startOnBoot: true,
  }, async (taskId) => {
    console.log('[BackgroundFetch] Task:', taskId);
    
    const syncManager = new MobileSyncManager();
    await syncManager.syncAll();
    
    BackgroundFetch.finish(taskId);
  }, (error) => {
    console.error('[BackgroundFetch] Error:', error);
  });
};
```

---

## Push Notifications

```typescript
import messaging from '@react-native-firebase/messaging';

export const setupPushNotifications = async () => {
  const authStatus = await messaging().requestPermission();
  
  if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
    const token = await messaging().getToken();
    await api.post('/users/fcm-token', { token });
  }

  messaging().onMessage(async remoteMessage => {
    console.log('Notification:', remoteMessage);
  });
};
```

---

## Biometric Authentication

```typescript
import ReactNativeBiometrics from 'react-native-biometrics';

export const useBiometricAuth = () => {
  const authenticate = async (): Promise<boolean> => {
    const { available } = await ReactNativeBiometrics.isSensorAvailable();
    
    if (!available) {
      return false;
    }

    const { success } = await ReactNativeBiometrics.simplePrompt({
      promptMessage: 'Authenticate to continue',
    });

    return success;
  };

  return { authenticate };
};
```

---

## Barcode Scanning

```typescript
import { RNCamera } from 'react-native-camera';

export const BarcodeScanner = ({ onScan }) => {
  const handleBarCodeRead = (event) => {
    onScan(event.data);
  };

  return (
    <RNCamera
      style={{ flex: 1 }}
      onBarCodeRead={handleBarCodeRead}
      barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
    />
  );
};
```

---

## Testing

```bash
# Unit tests
npm test

# E2E tests (Detox)
npm run test:e2e:ios
npm run test:e2e:android
```

---

## Deployment

### iOS

```bash
cd ios
pod install
cd ..
npm run build:ios
```

### Android

```bash
npm run build:android
```

---

## Troubleshooting

### Issue: Sync not working

**Solution:**
1. Check network connection
2. Verify API_URL in .env
3. Check token validity
4. Review sync logs

### Issue: Database errors

**Solution:**
1. Clear app data
2. Reinstall app
3. Check entity definitions
4. Verify TypeORM config

---

## References

- [React Native Documentation](https://reactnative.dev/)
- [TypeORM Documentation](https://typeorm.io/)
- [NetInfo](https://github.com/react-native-netinfo/react-native-netinfo)

---

**Last Updated:** 2026-03-15  
**Maintained By:** Mobile Team
