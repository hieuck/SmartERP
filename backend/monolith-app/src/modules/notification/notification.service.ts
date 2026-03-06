import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(tenantId: string, userId: string): Promise<Notification[]> {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .select([
        'notification.id',
        'notification.title',
        'notification.message',
        'notification.type',
        'notification.status',
        'notification.link',
        'notification.readAt',
        'notification.createdAt',
      ])
      .where('notification.tenantId = :tenantId', { tenantId })
      .andWhere('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .take(50)
      .getMany();
  }

  async findUnread(tenantId: string, userId: string): Promise<Notification[]> {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .select([
        'notification.id',
        'notification.title',
        'notification.message',
        'notification.type',
        'notification.status',
        'notification.link',
        'notification.createdAt',
      ])
      .where('notification.tenantId = :tenantId', { tenantId })
      .andWhere('notification.userId = :userId', { userId })
      .andWhere('notification.status = :status', { status: NotificationStatus.UNREAD })
      .orderBy('notification.createdAt', 'DESC')
      .getMany();
  }

  async findById(tenantId: string, id: string): Promise<Notification> {
    const cacheKey = generateCacheKey('notification', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const notification = await this.notificationRepository.findOne({
          where: { tenantId, id },
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
    tenantId: string,
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    link?: string,
    metadata?: Record<string, unknown>,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      tenantId,
      userId,
      title,
      message,
      type,
      link,
      metadata,
    });
    return this.notificationRepository.save(notification);
  }

  async markAsRead(tenantId: string, id: string): Promise<Notification> {
    await this.findById(tenantId, id);
    await this.notificationRepository.update(
      { tenantId, id },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );

    // Invalidate cache
    const cacheKey = generateCacheKey('notification', tenantId, id);
    await this.cacheService.del(cacheKey);

    return this.findById(tenantId, id);
  }

  async markAllAsRead(tenantId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { tenantId, userId, status: NotificationStatus.UNREAD },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );
  }

  async archive(tenantId: string, id: string): Promise<Notification> {
    await this.findById(tenantId, id);
    await this.notificationRepository.update(
      { tenantId, id },
      { status: NotificationStatus.ARCHIVED },
    );

    // Invalidate cache
    const cacheKey = generateCacheKey('notification', tenantId, id);
    await this.cacheService.del(cacheKey);

    return this.findById(tenantId, id);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.findById(tenantId, id);
    await this.notificationRepository.delete({ tenantId, id });

    // Invalidate cache
    const cacheKey = generateCacheKey('notification', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { tenantId, userId, status: NotificationStatus.UNREAD },
    });
  }
}
