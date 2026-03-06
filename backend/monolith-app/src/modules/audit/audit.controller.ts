import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuditLog } from './entities/audit-log.entity';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async findAll(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
  ): Promise<AuditLog[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.auditService.findAll(tenantId, start, end, userId, entityType);
  }

  @Get('logs/entity/:entityType/:entityId')
  async findByEntity(
    @TenantId() tenantId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditService.findByEntity(tenantId, entityType, entityId);
  }

  @Get('logs/user/:userId')
  async findByUser(
    @TenantId() tenantId: string,
    @Param('userId') userId: string,
  ): Promise<AuditLog[]> {
    return this.auditService.findByUser(tenantId, userId);
  }

  @Get('summary')
  async getActivitySummary(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Record<string, unknown>> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.auditService.getActivitySummary(tenantId, start, end);
  }
}
