/**
 * NotificationController Integration Tests
 * Coverage target: 95%+
 * 
 * Test cases:
 * 1. GET /notifications - Get all notifications
 * 2. GET /notifications/unread - Get unread notifications
 * 3. GET /notifications/unread/count - Get unread count
 * 4. GET /notifications/:id - Get notification by ID
 * 5. POST /notifications - Create notification
 * 6. POST /notifications/:id/read - Mark as read
 * 7. POST /notifications/read-all - Mark all as read
 * 8. POST /notifications/:id/archive - Archive notification
 * 9. DELETE /notifications/:id - Delete notification
 * 10. Authentication tests
 * 11. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { NotificationType, NotificationStatus } from './enums';

describe('NotificationController (Integration)', () => {
  let app: INestApplication;
  let notificationService: jest.Mocked<NotificationService>;

  const mockUser = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['user'],
  };

  const mockNotification = {
    id: 'notification-123',
    userId: 'user-123',
    title: 'New Order',
    message: 'You have a new order #ORD-001',
    type: NotificationType.INFO,
    status: NotificationStatus.UNREAD,
    link: '/orders/ORD-001',
    metadata: { orderId: 'ORD-001' },
    readAt: null,
    createdAt: '2024-01-15T10:00:00.000Z',
  };

  beforeAll(async () => {
    const mockNotificationService = {
      findAll: jest.fn(),
      findUnread: jest.fn(),
      getUnreadCount: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      archive: jest.fn(),
      delete: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          request.user = mockUser;
          return true;
        }
        
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    notificationService = moduleFixture.get(NotificationService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /notifications', () => {
    it('should return all notifications for user', async () => {
      const notifications = [mockNotification];
      notificationService.findAll.mockResolvedValue(notifications as any);

      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(notifications);
      expect(notificationService.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no notifications', async () => {
      notificationService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return notifications with different types', async () => {
      const notifications = [
        { ...mockNotification, type: NotificationType.INFO },
        { ...mockNotification, id: 'notif-2', type: NotificationType.WARNING },
        { ...mockNotification, id: 'notif-3', type: NotificationType.ERROR },
        { ...mockNotification, id: 'notif-4', type: NotificationType.SUCCESS },
      ];

      notificationService.findAll.mockResolvedValue(notifications as any);

      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveLength(4);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/notifications')
        .expect(401);
    });

    it('should handle service errors', async () => {
      notificationService.findAll.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('GET /notifications/unread', () => {
    it('should return unread notifications', async () => {
      const unreadNotifications = [mockNotification];
      notificationService.findUnread.mockResolvedValue(unreadNotifications as any);

      const response = await request(app.getHttpServer())
        .get('/notifications/unread')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(unreadNotifications);
      expect(notificationService.findUnread).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no unread notifications', async () => {
      notificationService.findUnread.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/notifications/unread')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should only return UNREAD status notifications', async () => {
      const unreadNotifications = [
        { ...mockNotification, status: NotificationStatus.UNREAD },
        { ...mockNotification, id: 'notif-2', status: NotificationStatus.UNREAD },
      ];

      notificationService.findUnread.mockResolvedValue(unreadNotifications as any);

      const response = await request(app.getHttpServer())
        .get('/notifications/unread')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.every((n: any) => n.status === NotificationStatus.UNREAD)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/notifications/unread')
        .expect(401);
    });
  });

  describe('GET /notifications/unread/count', () => {
    it('should return unread count', async () => {
      notificationService.getUnreadCount.mockResolvedValue(5);

      const response = await request(app.getHttpServer())
        .get('/notifications/unread/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({ count: 5 });
      expect(notificationService.getUnreadCount).toHaveBeenCalledWith(mockUser);
    });

    it('should return zero when no unread notifications', async () => {
      notificationService.getUnreadCount.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/notifications/unread/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({ count: 0 });
    });

    it('should return large count correctly', async () => {
      notificationService.getUnreadCount.mockResolvedValue(999);

      const response = await request(app.getHttpServer())
        .get('/notifications/unread/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.count).toBe(999);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/notifications/unread/count')
        .expect(401);
    });
  });

  describe('GET /notifications/:id', () => {
    it('should return notification by ID', async () => {
      notificationService.findById.mockResolvedValue(mockNotification as any);

      const response = await request(app.getHttpServer())
        .get('/notifications/notification-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockNotification);
      expect(notificationService.findById).toHaveBeenCalledWith(mockUser, 'notification-123');
    });

    it('should return 404 when notification not found', async () => {
      notificationService.findById.mockRejectedValue(
        new HttpException('Notification with ID notification-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/notifications/notification-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/notifications/notification-123')
        .expect(401);
    });
  });

  describe('POST /notifications', () => {
    it('should create notification successfully', async () => {
      const createData = {
        userId: 'user-123',
        title: 'New Notification',
        message: 'Test message',
        type: NotificationType.INFO,
        link: '/test',
        metadata: { key: 'value' },
      };

      notificationService.create.mockResolvedValue(mockNotification as any);

      const response = await request(app.getHttpServer())
        .post('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(createData)
        .expect(201);

      expect(response.body).toEqual(mockNotification);
      expect(notificationService.create).toHaveBeenCalledWith(
        mockUser,
        'New Notification',
        'Test message',
        NotificationType.INFO,
        '/test',
        { key: 'value' },
      );
    });

    it('should create notification without optional fields', async () => {
      const createData = {
        userId: 'user-123',
        title: 'Simple Notification',
        message: 'Simple message',
      };

      notificationService.create.mockResolvedValue(mockNotification as any);

      await request(app.getHttpServer())
        .post('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send(createData)
        .expect(201);

      expect(notificationService.create).toHaveBeenCalledWith(
        mockUser,
        'Simple Notification',
        'Simple message',
        undefined,
        undefined,
        undefined,
      );
    });

    it('should create notification with different types', async () => {
      const types = [
        NotificationType.INFO,
        NotificationType.WARNING,
        NotificationType.ERROR,
        NotificationType.SUCCESS,
      ];

      for (const type of types) {
        notificationService.create.mockResolvedValue({ ...mockNotification, type } as any);

        await request(app.getHttpServer())
          .post('/notifications')
          .set('Authorization', 'Bearer valid-token')
          .send({
            userId: 'user-123',
            title: 'Test',
            message: 'Test',
            type,
          })
          .expect(201);
      }
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/notifications')
        .send({ userId: 'user-123', title: 'Test', message: 'Test' })
        .expect(401);
    });
  });

  describe('POST /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const readNotification = {
        ...mockNotification,
        status: NotificationStatus.READ,
        readAt: new Date('2024-01-15T10:05:00Z'),
      };

      notificationService.markAsRead.mockResolvedValue(readNotification as any);

      const response = await request(app.getHttpServer())
        .post('/notifications/notification-123/read')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(response.body.status).toBe(NotificationStatus.READ);
      expect(response.body.readAt).toBeDefined();
      expect(notificationService.markAsRead).toHaveBeenCalledWith(mockUser, 'notification-123');
    });

    it('should return 404 when notification not found', async () => {
      notificationService.markAsRead.mockRejectedValue(
        new HttpException('Notification not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/notifications/notification-999/read')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should handle already read notification', async () => {
      const alreadyRead = {
        ...mockNotification,
        status: NotificationStatus.READ,
        readAt: new Date('2024-01-15T09:00:00Z'),
      };

      notificationService.markAsRead.mockResolvedValue(alreadyRead as any);

      const response = await request(app.getHttpServer())
        .post('/notifications/notification-123/read')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(response.body.status).toBe(NotificationStatus.READ);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/notifications/notification-123/read')
        .expect(401);
    });
  });

  describe('POST /notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      notificationService.markAllAsRead.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/notifications/read-all')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(notificationService.markAllAsRead).toHaveBeenCalledWith(mockUser);
    });

    it('should handle when no unread notifications', async () => {
      notificationService.markAllAsRead.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/notifications/read-all')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/notifications/read-all')
        .expect(401);
    });
  });

  describe('POST /notifications/:id/archive', () => {
    it('should archive notification', async () => {
      const archivedNotification = {
        ...mockNotification,
        status: NotificationStatus.ARCHIVED,
      };

      notificationService.archive.mockResolvedValue(archivedNotification as any);

      const response = await request(app.getHttpServer())
        .post('/notifications/notification-123/archive')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(response.body.status).toBe(NotificationStatus.ARCHIVED);
      expect(notificationService.archive).toHaveBeenCalledWith(mockUser, 'notification-123');
    });

    it('should return 404 when notification not found', async () => {
      notificationService.archive.mockRejectedValue(
        new HttpException('Notification not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/notifications/notification-999/archive')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should archive already read notification', async () => {
      const readThenArchived = {
        ...mockNotification,
        status: NotificationStatus.ARCHIVED,
        readAt: new Date('2024-01-15T09:00:00Z'),
      };

      notificationService.archive.mockResolvedValue(readThenArchived as any);

      const response = await request(app.getHttpServer())
        .post('/notifications/notification-123/archive')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(response.body.status).toBe(NotificationStatus.ARCHIVED);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/notifications/notification-123/archive')
        .expect(401);
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete notification successfully', async () => {
      notificationService.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/notifications/notification-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(notificationService.delete).toHaveBeenCalledWith(mockUser, 'notification-123');
    });

    it('should return 404 when notification not found', async () => {
      notificationService.delete.mockRejectedValue(
        new HttpException('Notification not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/notifications/notification-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should delete archived notification', async () => {
      notificationService.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/notifications/notification-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete('/notifications/notification-123')
        .expect(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent notification creation', async () => {
      notificationService.create.mockResolvedValue(mockNotification as any);

      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/notifications')
            .set('Authorization', 'Bearer valid-token')
            .send({ userId: 'user-123', title: 'Test', message: 'Test' }),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle very long notification title', async () => {
      const longTitle = 'a'.repeat(500);
      notificationService.create.mockResolvedValue({ ...mockNotification, title: longTitle } as any);

      await request(app.getHttpServer())
        .post('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send({ userId: 'user-123', title: longTitle, message: 'Test' })
        .expect(201);
    });

    it('should handle very long notification message', async () => {
      const longMessage = 'a'.repeat(5000);
      notificationService.create.mockResolvedValue({ ...mockNotification, message: longMessage } as any);

      await request(app.getHttpServer())
        .post('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send({ userId: 'user-123', title: 'Test', message: longMessage })
        .expect(201);
    });

    it('should handle special characters in notification content', async () => {
      const specialContent = '<script>alert("XSS")</script> & More!';
      notificationService.create.mockResolvedValue({
        ...mockNotification,
        message: specialContent,
      } as any);

      await request(app.getHttpServer())
        .post('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send({ userId: 'user-123', title: 'Test', message: specialContent })
        .expect(201);
    });

    it('should handle complex metadata objects', async () => {
      const complexMetadata = {
        orderId: 'ORD-001',
        items: [
          { id: 1, name: 'Product 1', quantity: 2 },
          { id: 2, name: 'Product 2', quantity: 1 },
        ],
        customer: {
          id: 'cust-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
        totals: {
          subtotal: 100000,
          tax: 10000,
          total: 110000,
        },
      };

      notificationService.create.mockResolvedValue({
        ...mockNotification,
        metadata: complexMetadata,
      } as any);

      await request(app.getHttpServer())
        .post('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send({
          userId: 'user-123',
          title: 'Test',
          message: 'Test',
          metadata: complexMetadata,
        })
        .expect(201);
    });

    it('should handle rapid read/unread operations', async () => {
      const readNotif = { ...mockNotification, status: NotificationStatus.READ };
      notificationService.markAsRead.mockResolvedValue(readNotif as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/notifications/notification-123/read')
            .set('Authorization', 'Bearer valid-token'),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle bulk archive operations', async () => {
      const archivedNotif = { ...mockNotification, status: NotificationStatus.ARCHIVED };
      notificationService.archive.mockResolvedValue(archivedNotif as any);

      const notificationIds = ['notif-1', 'notif-2', 'notif-3', 'notif-4', 'notif-5'];

      for (const id of notificationIds) {
        await request(app.getHttpServer())
          .post(`/notifications/${id}/archive`)
          .set('Authorization', 'Bearer valid-token')
          .expect(201);
      }
    });

    it('should handle null metadata gracefully', async () => {
      notificationService.create.mockResolvedValue({
        ...mockNotification,
        metadata: null,
      } as any);

      await request(app.getHttpServer())
        .post('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send({
          userId: 'user-123',
          title: 'Test',
          message: 'Test',
          metadata: null,
        })
        .expect(201);
    });

    it('should handle empty link string', async () => {
      notificationService.create.mockResolvedValue({
        ...mockNotification,
        link: '',
      } as any);

      await request(app.getHttpServer())
        .post('/notifications')
        .set('Authorization', 'Bearer valid-token')
        .send({
          userId: 'user-123',
          title: 'Test',
          message: 'Test',
          link: '',
        })
        .expect(201);
    });
  });
});
