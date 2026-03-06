import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Notification, NotificationType } from './entities/notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user: { id: string } },
  ): Promise<Notification[]> {
    return this.notificationService.findAll(tenantId, req.user.id);
  }

  @Get('unread')
  async findUnread(
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user: { id: string } },
  ): Promise<Notification[]> {
    return this.notificationService.findUnread(tenantId, req.user.id);
  }

  @Get('unread/count')
  async getUnreadCount(
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user: { id: string } },
  ): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(tenantId, req.user.id);
    return { count };
  }

  @Get(':id')
  async findById(@TenantId() tenantId: string, @Param('id') id: string): Promise<Notification> {
    return this.notificationService.findById(tenantId, id);
  }

  @Post()
  async create(
    @TenantId() tenantId: string,
    @Body('userId') userId: string,
    @Body('title') title: string,
    @Body('message') message: string,
    @Body('type') type?: NotificationType,
    @Body('link') link?: string,
    @Body('metadata') metadata?: Record<string, unknown>,
  ): Promise<Notification> {
    return this.notificationService.create(tenantId, userId, title, message, type, link, metadata);
  }

  @Post(':id/read')
  async markAsRead(@TenantId() tenantId: string, @Param('id') id: string): Promise<Notification> {
    return this.notificationService.markAsRead(tenantId, id);
  }

  @Post('read-all')
  async markAllAsRead(
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user: { id: string } },
  ): Promise<void> {
    return this.notificationService.markAllAsRead(tenantId, req.user.id);
  }

  @Post(':id/archive')
  async archive(@TenantId() tenantId: string, @Param('id') id: string): Promise<Notification> {
    return this.notificationService.archive(tenantId, id);
  }

  @Delete(':id')
  async delete(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.notificationService.delete(tenantId, id);
  }
}
