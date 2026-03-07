import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Notification, NotificationType } from './entities/notification.entity';

import { User } from '@/common/security/permission.service';
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Request() req: Express.Request & { user: { id: string } },
  ): Promise<Notification[]> {
    return this.notificationService.findAll(user, req.user.id);
  }

  @Get('unread')
  async findUnread(
    @CurrentUser() user: User,
    @Request() req: Express.Request & { user: { id: string } },
  ): Promise<Notification[]> {
    return this.notificationService.findUnread(user, req.user.id);
  }

  @Get('unread/count')
  async getUnreadCount(
    @CurrentUser() user: User,
    @Request() req: Express.Request & { user: { id: string } },
  ): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(user, req.user.id);
    return { count };
  }

  @Get(':id')
  async findById(@CurrentUser() user: User, @Param('id') id: string): Promise<Notification> {
    return this.notificationService.findById(user, id);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body('userId') userId: string,
    @Body('title') title: string,
    @Body('message') message: string,
    @Body('type') type?: NotificationType,
    @Body('link') link?: string,
    @Body('metadata') metadata?: Record<string, unknown>,
  ): Promise<Notification> {
    return this.notificationService.create(user, userId, title, message, type, link, metadata);
  }

  @Post(':id/read')
  async markAsRead(@CurrentUser() user: User, @Param('id') id: string): Promise<Notification> {
    return this.notificationService.markAsRead(user, id);
  }

  @Post('read-all')
  async markAllAsRead(
    @CurrentUser() user: User,
    @Request() req: Express.Request & { user: { id: string } },
  ): Promise<void> {
    return this.notificationService.markAllAsRead(user, req.user.id);
  }

  @Post(':id/archive')
  async archive(@CurrentUser() user: User, @Param('id') id: string): Promise<Notification> {
    return this.notificationService.archive(user, id);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    return this.notificationService.delete(user, id);
  }
}
