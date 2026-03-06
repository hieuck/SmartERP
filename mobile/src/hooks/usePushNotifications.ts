import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { PushNotificationService } from '../services/notifications/pushNotifications';

/**
 * Hook for push notifications
 * Requirement 47.6: Push notification management
 */
export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    initializePushNotifications();

    // Set up listeners
    notificationListener.current = PushNotificationService.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      },
    );

    responseListener.current = PushNotificationService.addNotificationResponseListener(
      (response) => {
        // Handle notification tap
        console.log('Notification tapped:', response);
        // You can navigate to specific screens based on notification data
      },
    );

    return () => {
      if (notificationListener.current) {
        PushNotificationService.removeNotificationListener(notificationListener.current);
      }
      if (responseListener.current) {
        PushNotificationService.removeNotificationListener(responseListener.current);
      }
    };
  }, []);

  const initializePushNotifications = async () => {
    const granted = await PushNotificationService.requestPermissions();
    setHasPermission(granted);

    if (granted) {
      const token = await PushNotificationService.getPushToken();
      setPushToken(token);
    }
  };

  const showNotification = async (title: string, body: string, data?: Record<string, any>) => {
    return await PushNotificationService.showNotification({ title, body, data });
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: Record<string, any>,
  ) => {
    return await PushNotificationService.scheduleLocalNotification({ title, body, data }, trigger);
  };

  const cancelNotification = async (notificationId: string) => {
    await PushNotificationService.cancelNotification(notificationId);
  };

  const cancelAllNotifications = async () => {
    await PushNotificationService.cancelAllNotifications();
  };

  const getBadgeCount = async () => {
    return await PushNotificationService.getBadgeCount();
  };

  const setBadgeCount = async (count: number) => {
    await PushNotificationService.setBadgeCount(count);
  };

  const clearBadge = async () => {
    await PushNotificationService.clearBadge();
  };

  return {
    pushToken,
    notification,
    hasPermission,
    showNotification,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    getBadgeCount,
    setBadgeCount,
    clearBadge,
  };
};
