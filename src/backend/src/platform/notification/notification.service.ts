import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User } from '@/common/security/permission.service';

@Injectable()
export class NotificationService {
  private secureNotificationRepo: SecureRepository<Notification>;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureNotificationRepo = new SecureRepository(
      notificationRepository,
      permissionService,
      'Notification',
    );
  }

  async findAll(user: User): Promise<Notification[]> {
    const notifications = await this.secureNotificationRepo.find(user, {
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
    return notifications.slice(0, 50); // Take 50 most recent
  }

  async findUnread(user: User): Promise<Notification[]> {
    return this.secureNotificationRepo.find(user, {
      where: { userId: user.id, status: NotificationStatus.UNREAD },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(user: User, id: string): Promise<Notification> {
    const cacheKey = generateCacheKey('notification', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const notification = await this.secureNotificationRepo.findOne(user, {
          where: { id },
        });
        if (!notification) {
          throw new NotFoundException(`Notification with ID ${id} not found`);
        }
        return notification;
      },
      CacheTTL.SHORT, // Notifications change frequently
    );
  }

  async create(
    user: User,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    link?: string,
    metadata?: Record<string, unknown>,
  ): Promise<Notification> {
    const notification = {
      userId: user.id,
      title,
      message,
      type,
      link,
      metadata,
    };
    return this.secureNotificationRepo.save(user, notification);
  }

  async markAsRead(user: User, id: string): Promise<Notification> {
    const notification = await this.findById(user, id);
    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    const updated = await this.secureNotificationRepo.save(user, notification);

    // Invalidate cache
    const cacheKey = generateCacheKey('notification', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async markAllAsRead(user: User): Promise<void> {
    const unreadNotifications = await this.secureNotificationRepo.find(user, {
      where: { userId: user.id, status: NotificationStatus.UNREAD },
    });

    for (const notification of unreadNotifications) {
      notification.status = NotificationStatus.READ;
      notification.readAt = new Date();
      await this.secureNotificationRepo.save(user, notification);
    }
  }

  async archive(user: User, id: string): Promise<Notification> {
    const notification = await this.findById(user, id);
    notification.status = NotificationStatus.ARCHIVED;

    const updated = await this.secureNotificationRepo.save(user, notification);

    // Invalidate cache
    const cacheKey = generateCacheKey('notification', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async delete(user: User, id: string): Promise<void> {
    const notification = await this.findById(user, id);
    await this.secureNotificationRepo.remove(user, notification);

    // Invalidate cache
    const cacheKey = generateCacheKey('notification', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async getUnreadCount(user: User): Promise<number> {
    const unreadNotifications = await this.secureNotificationRepo.find(user, {
      where: { userId: user.id, status: NotificationStatus.UNREAD },
    });
    return unreadNotifications.length;
  }
}
