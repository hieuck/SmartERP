import { Controller, Post, Body, UseGuards, Res } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Response } from 'express';
import { ImportExportService } from './import-export.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

import { User } from '@/common/security/permission.service';
@Controller('import-export')
@UseGuards(JwtAuthGuard)
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Post('export/csv')
  async exportToCSV(
    @CurrentUser() user: User,
    @Body('entityType') entityType: string,
    @Body('data') data: Record<string, unknown>[],
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.importExportService.exportToCSV(user, entityType, data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${entityType}.csv`);
    res.send(csv);
  }

  @Post('import/csv')
  async importFromCSV(
    @CurrentUser() user: User,
    @Body('entityType') entityType: string,
    @Body('csvContent') csvContent: string,
  ): Promise<Record<string, unknown>[]> {
    return this.importExportService.importFromCSV(user, entityType, csvContent);
  }
}
