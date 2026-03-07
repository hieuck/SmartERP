import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';

/**
 * Push Notification Service
 * Requirement 47.6: Push notifications for important events
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class PushNotificationService {
  private static pushToken: string | null = null;

  /**
   * Request notification permissions
   * Requirement 47.6: Enable push notifications
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        Alert.alert(
          'Push Notifications',
          'Push notifications only work on physical devices, not in simulators.',
        );
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Push notification permission is required to receive important updates.',
          [{ text: 'OK' }],
        );
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get push notification token
   * This token should be sent to the backend to enable push notifications
   */
  static async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with actual Expo project ID
      });

      this.pushToken = token.data;
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Schedule a local notification
   * Requirement 47.6: Local notifications for offline scenarios
   */
  static async scheduleLocalNotification(
    notification: NotificationData,
    trigger?: Notifications.NotificationTriggerInput,
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
        },
        trigger: trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Show immediate notification
   */
  static async showNotification(notification: NotificationData): Promise<string> {
    return this.scheduleLocalNotification(notification);
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get badge count
   */
  static async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear badge count
   */
  static async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Add notification received listener
   */
  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  static addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Remove notification listener
   */
  static removeNotificationListener(subscription: Notifications.Subscription): void {
    subscription.remove();
  }
}
