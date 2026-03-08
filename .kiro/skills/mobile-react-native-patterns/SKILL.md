---
name: mobile-react-native-patterns
description: Best practices for React Native + Expo development in SmartERP mobile app. Use when working on React Native components, Expo features, navigation, offline-first architecture, or mobile testing.
---

# Mobile React Native Patterns

## When to Use This Skill

Use this skill when working on:

- ✅ React Native components in `src/mobile/`
- ✅ Expo features (camera, barcode scanner, notifications)
- ✅ React Navigation setup
- ✅ Offline-first architecture
- ✅ Mobile testing with Jest + React Native Testing Library
- ✅ Redux state management for mobile

## Tech Stack Overview

```json
{
  "framework": "React Native 0.73",
  "platform": "Expo ~50.0",
  "navigation": "React Navigation 6.1",
  "state": "Redux Toolkit 2.0",
  "storage": "AsyncStorage 1.21",
  "ui": "React Native Paper 5.11",
  "testing": "Jest 29.7 + React Native Testing Library 12.4"
}
```

## Project Structure

```
src/mobile/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components (routes)
│   ├── navigation/       # Navigation configuration
│   ├── store/            # Redux store
│   ├── services/         # API services
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   └── __tests__/        # Test files
├── assets/               # Images, fonts
├── app.json              # Expo configuration
└── package.json
```

## Core Patterns

### 1. Screen Component Structure

**✅ CORRECT: Functional Screen with TypeScript**

```typescript
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button, Card, FAB } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';

type ProductListScreenProps = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

export const ProductListScreen: React.FC<ProductListScreenProps> = ({ navigation }) => {
  const [products, setProducts] = React.useState([]);

  const handleAddProduct = () => {
    navigation.navigate('ProductForm');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge">{item.name}</Text>
              <Text variant="bodyMedium">{item.price}</Text>
            </Card.Content>
          </Card>
        )}
      />
      <FAB style={styles.fab} icon="plus" onPress={handleAddProduct} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
```

**Key Points:**

- Use React Native Paper for UI components
- Use StyleSheet for styling (not inline styles)
- Type navigation props with NativeStackScreenProps
- Use FlatList for lists (better performance than ScrollView)

### 2. Navigation Setup (React Navigation)

**✅ CORRECT: Stack Navigator with TypeScript**

```typescript
// navigation/types.ts
export type RootStackParamList = {
  Home: undefined;
  ProductList: undefined;
  ProductDetail: { productId: string };
  ProductForm: { productId?: string };
};

// navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@/screens/HomeScreen';
import { ProductListScreen } from '@/screens/ProductListScreen';
import { ProductDetailScreen } from '@/screens/ProductDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#6200ee' },
          headerTintColor: '#fff',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'SmartERP' }} />
        <Stack.Screen
          name="ProductList"
          component={ProductListScreen}
          options={{ title: 'Products' }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ title: 'Product Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Usage in screen
const ProductListScreen: React.FC<ProductListScreenProps> = ({ navigation }) => {
  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  return <>{/* ... */}</>;
};
```

**Key Points:**

- Define param list types for type-safe navigation
- Use `createNativeStackNavigator` for better performance
- Type screen props with `NativeStackScreenProps`

### 3. State Management (Redux Toolkit)

**✅ CORRECT: Redux Slice for Mobile**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      // Persist to AsyncStorage
      AsyncStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      AsyncStorage.removeItem('token');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
```

### 4. Offline-First Data Sync

**✅ CORRECT: Offline Queue Pattern**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  timestamp: number;
}

export class OfflineQueue {
  private static QUEUE_KEY = '@offline_queue';

  static async addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp'>) {
    const queue = await this.getQueue();
    const newAction: QueuedAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    queue.push(newAction);
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }

  static async getQueue(): Promise<QueuedAction[]> {
    const data = await AsyncStorage.getItem(this.QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static async processQueue() {
    const isConnected = await NetInfo.fetch().then((state) => state.isConnected);
    if (!isConnected) return;

    const queue = await this.getQueue();
    for (const action of queue) {
      try {
        await this.executeAction(action);
        await this.removeFromQueue(action.id);
      } catch (error) {
        console.error('Failed to process action:', error);
      }
    }
  }

  private static async executeAction(action: QueuedAction) {
    // Execute API call based on action type
    switch (action.type) {
      case 'CREATE':
        await api.post(`/${action.entity}`, action.data);
        break;
      case 'UPDATE':
        await api.put(`/${action.entity}/${action.data.id}`, action.data);
        break;
      case 'DELETE':
        await api.delete(`/${action.entity}/${action.data.id}`);
        break;
    }
  }

  private static async removeFromQueue(id: string) {
    const queue = await this.getQueue();
    const filtered = queue.filter((action) => action.id !== id);
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(filtered));
  }
}

// Usage in component
const ProductFormScreen: React.FC = () => {
  const handleSubmit = async (data: ProductFormData) => {
    const isConnected = await NetInfo.fetch().then((state) => state.isConnected);

    if (isConnected) {
      await api.post('/products', data);
    } else {
      await OfflineQueue.addToQueue({
        type: 'CREATE',
        entity: 'products',
        data,
      });
      Alert.alert('Offline', 'Changes will sync when online');
    }
  };
};
```

### 5. Expo Features

**✅ CORRECT: Camera & Barcode Scanner**

```typescript
import { Camera, CameraView } from 'expo-camera';
import { useState } from 'react';
import { Button, View, StyleSheet } from 'react-native';

export const BarcodeScannerScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    alert(`Barcode ${data} scanned!`);
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13'],
        }}
      />
      {scanned && <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />}
    </View>
  );
};
```

**✅ CORRECT: Local Notifications**

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token));
  }, []);

  const schedulePushNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { data: 'goes here' },
      },
      trigger: { seconds: 2 },
    });
  };

  return { expoPushToken, schedulePushNotification };
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}
```

## Testing Patterns (Jest + React Native Testing Library)

### 1. Component Testing

**✅ CORRECT: Test Screen Component**

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProductListScreen } from './ProductListScreen';
import { NavigationContainer } from '@react-navigation/native';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('ProductListScreen', () => {
  it('should render product list', () => {
    render(
      <NavigationContainer>
        <ProductListScreen />
      </NavigationContainer>,
    );

    expect(screen.getByText('Products')).toBeTruthy();
  });

  it('should navigate to product form on FAB press', () => {
    render(
      <NavigationContainer>
        <ProductListScreen />
      </NavigationContainer>,
    );

    const fab = screen.getByTestId('add-product-fab');
    fireEvent.press(fab);

    expect(mockNavigate).toHaveBeenCalledWith('ProductForm');
  });
});
```

### 2. Hook Testing

**✅ CORRECT: Test Custom Hook**

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useOfflineQueue } from './useOfflineQueue';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('useOfflineQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add action to queue when offline', async () => {
    const { result } = renderHook(() => useOfflineQueue());

    await act(async () => {
      await result.current.addToQueue({
        type: 'CREATE',
        entity: 'products',
        data: { name: 'Test' },
      });
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
```

### 3. Navigation Testing

**✅ CORRECT: Test Navigation Flow**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '@/navigation/RootNavigator';

describe('Navigation Flow', () => {
  it('should navigate from home to product list', async () => {
    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>,
    );

    // Start at home
    expect(screen.getByText('Home')).toBeTruthy();

    // Navigate to products
    const productsButton = screen.getByText('View Products');
    fireEvent.press(productsButton);

    // Verify navigation
    await waitFor(() => {
      expect(screen.getByText('Product List')).toBeTruthy();
    });
  });
});
```

## Performance Optimization

### 1. FlatList Optimization

```typescript
import { FlatList, View } from 'react-native';

const ProductList: React.FC<{ products: Product[] }> = ({ products }) => {
  const renderItem = React.useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} />,
    [],
  );

  const keyExtractor = React.useCallback((item: Product) => item.id, []);

  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      // Performance props
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={5}
      // Pull to refresh
      refreshing={false}
      onRefresh={() => {}}
    />
  );
};
```

### 2. Image Optimization

```typescript
import { Image } from 'expo-image';

const ProductImage: React.FC<{ uri: string }> = ({ uri }) => {
  return (
    <Image
      source={{ uri }}
      style={{ width: 200, height: 200 }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
    />
  );
};
```

### 3. Memoization

```typescript
import React from 'react';

const ProductCard = React.memo<{ product: Product }>(({ product }) => {
  return (
    <Card>
      <Text>{product.name}</Text>
    </Card>
  );
});
```

## Common Pitfalls

### ❌ Anti-Pattern 1: Not Handling Permissions

```typescript
// BAD
const { status } = await Camera.requestCameraPermissionsAsync();
// Proceed without checking status

// GOOD
const { status } = await Camera.requestCameraPermissionsAsync();
if (status !== 'granted') {
  Alert.alert('Permission denied', 'Camera access is required');
  return;
}
```

### ❌ Anti-Pattern 2: Not Handling Offline State

```typescript
// BAD
await api.post('/products', data); // Fails when offline

// GOOD
const isConnected = await NetInfo.fetch().then((state) => state.isConnected);
if (isConnected) {
  await api.post('/products', data);
} else {
  await OfflineQueue.addToQueue({ type: 'CREATE', entity: 'products', data });
}
```

### ❌ Anti-Pattern 3: Using ScrollView for Long Lists

```typescript
// BAD
<ScrollView>
  {products.map(product => <ProductCard key={product.id} product={product} />)}
</ScrollView>

// GOOD
<FlatList
  data={products}
  renderItem={({ item }) => <ProductCard product={item} />}
  keyExtractor={item => item.id}
/>
```

## Checklist

Before submitting mobile code, verify:

- [ ] ✅ TypeScript types defined for navigation and props
- [ ] ✅ React Native Paper components used consistently
- [ ] ✅ FlatList used for lists (not ScrollView)
- [ ] ✅ Permissions requested before using native features
- [ ] ✅ Offline state handled gracefully
- [ ] ✅ AsyncStorage used for persistence
- [ ] ✅ Tests written with React Native Testing Library
- [ ] ✅ Images optimized with expo-image
- [ ] ✅ Navigation typed with param lists
- [ ] ✅ Performance optimizations applied (memo, useCallback)

## Related Documentation

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [React Native Paper Documentation](https://callstack.github.io/react-native-paper/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

## Performance Optimization

### 1. FlatList Optimization

```typescript
const ProductList: React.FC = ({ products }) => {
  const renderItem = React.useCallback(
    ({ item }) => <ProductCard product={item} />,
    [],
  );

  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
};
```

### 2. Image Optimization

```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
  cachePolicy="memory-disk"
/>
```

## Common Pitfalls

### ❌ Not Handling Permissions

```typescript
// BAD
const { status } = await Camera.requestCameraPermissionsAsync();
// Proceed without checking

// GOOD
if (status !== 'granted') {
  Alert.alert('Permission denied');
  return;
}
```

### ❌ Not Handling Offline

```typescript
// BAD
await api.post('/products', data); // Fails offline

// GOOD
const isConnected = await NetInfo.fetch().then((s) => s.isConnected);
if (!isConnected) {
  await OfflineQueue.addToQueue({ type: 'CREATE', data });
}
```

## Checklist

- [ ] ✅ TypeScript types for navigation
- [ ] ✅ FlatList for lists
- [ ] ✅ Permissions requested
- [ ] ✅ Offline handling
- [ ] ✅ AsyncStorage for persistence
- [ ] ✅ Tests with RN Testing Library
- [ ] ✅ Performance optimizations

## Related Documentation

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
