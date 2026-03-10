import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuditLog } from './entities/audit-log.entity';

import { User } from '@/common/security/permission.service';
@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async findAll(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
  ): Promise<AuditLog[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.auditService.findAll(user, start, end, userId, entityType);
  }

  @Get('logs/entity/:entityType/:entityId')
  async findByEntity(
    @CurrentUser() user: User,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditService.findByEntity(user, entityType, entityId);
  }

  @Get('logs/user/:userId')
  async findByUser(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
  ): Promise<AuditLog[]> {
    return this.auditService.findByUser(user, userId);
  }

  @Get('summary')
  async getActivitySummary(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Record<string, unknown>> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.auditService.getActivitySummary(user, start, end);
  }
}
