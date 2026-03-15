import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { ApproveDeletionDto } from './dto/approve-deletion.dto';
import { CreateConsentDto } from './dto/create-consent.dto';
import { RequestDataDeletionDto } from './dto/request-data-deletion.dto';
import { RequestDataExportDto } from './dto/request-data-export.dto';
import { ConsentType } from './enums';
import { GdprService } from './gdpr.service';

@ApiTags('GDPR')
@ApiBearerAuth()
@Controller('gdpr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  // ==================== CONSENT MANAGEMENT ====================

  @Post('consent')
  @ApiOperation({ summary: 'Create or update consent' })
  async createConsent(@Request() req, @Body() dto: CreateConsentDto) {
    return this.gdprService.createConsent(req.user.id, req.user.tenantId, dto);
  }

  @Post('consent/:type/revoke')
  @ApiOperation({ summary: 'Revoke consent' })
  async revokeConsent(@Request() req, @Param('type') type: ConsentType) {
    await this.gdprService.revokeConsent(req.user.id, req.user.tenantId, type);
    return { message: 'Consent revoked successfully' };
  }

  @Get('consent')
  @ApiOperation({ summary: 'Get user consents' })
  async getUserConsents(@Request() req) {
    return this.gdprService.getUserConsents(req.user.id, req.user.tenantId);
  }

  @Get('consent/:type/status')
  @ApiOperation({ summary: 'Check if user has active consent' })
  async hasActiveConsent(@Request() req, @Param('type') type: ConsentType) {
    const hasConsent = await this.gdprService.hasActiveConsent(
      req.user.id,
      req.user.tenantId,
      type,
    );
    return { type, hasConsent };
  }

  // ==================== DATA EXPORT (GDPR Article 20) ====================

  @Post('export')
  @ApiOperation({ summary: 'Request data export (GDPR Article 20 - Right to data portability)' })
  async requestDataExport(@Request() req, @Body() dto: RequestDataExportDto) {
    return this.gdprService.requestDataExport(req.user.id, req.user.tenantId, dto);
  }

  @Get('export')
  @ApiOperation({ summary: 'Get user export requests' })
  async getUserExportRequests(@Request() req) {
    return this.gdprService.getUserExportRequests(req.user.id, req.user.tenantId);
  }

  @Get('export/:id')
  @ApiOperation({ summary: 'Get export request by ID' })
  async getExportRequest(@Request() req, @Param('id') id: string) {
    return this.gdprService.getExportRequest(id, req.user.id, req.user.tenantId);
  }

  // ==================== DATA DELETION (GDPR Article 17) ====================

  @Post('deletion')
  @ApiOperation({ summary: 'Request data deletion (GDPR Article 17 - Right to erasure)' })
  async requestDataDeletion(@Request() req, @Body() dto: RequestDataDeletionDto) {
    return this.gdprService.requestDataDeletion(req.user.id, req.user.tenantId, dto);
  }

  @Get('deletion')
  @ApiOperation({ summary: 'Get user deletion requests' })
  async getUserDeletionRequests(@Request() req) {
    return this.gdprService.getUserDeletionRequests(req.user.id, req.user.tenantId);
  }

  @Get('deletion/:id')
  @ApiOperation({ summary: 'Get deletion request by ID' })
  async getDeletionRequest(@Request() req, @Param('id') id: string) {
    return this.gdprService.getDeletionRequest(id, req.user.id, req.user.tenantId);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/deletion/pending')
  @Roles('admin', 'hr_manager')
  @ApiOperation({ summary: 'Get pending deletion requests (Admin only)' })
  async getPendingDeletionRequests(@Request() req) {
    return this.gdprService.getPendingDeletionRequests(req.user.tenantId);
  }

  @Get('admin/deletion/all')
  @Roles('admin', 'hr_manager')
  @ApiOperation({ summary: 'Get all deletion requests (Admin only)' })
  async getAllDeletionRequests(@Request() req) {
    return this.gdprService.getAllDeletionRequests(req.user.tenantId);
  }

  @Patch('admin/deletion/:id/approve')
  @Roles('admin', 'hr_manager')
  @ApiOperation({ summary: 'Approve or reject deletion request (Admin only)' })
  async approveDeletionRequest(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ApproveDeletionDto,
  ) {
    return this.gdprService.approveDeletionRequest(id, req.user.id, dto);
  }
}
