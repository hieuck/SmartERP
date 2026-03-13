import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { User } from '@/common/security/permission.service';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { ApprovalService } from './approval.service';
import { SubmitApprovalDto, RejectApprovalDto } from './dto/approval.dto';

@ApiTags('Approvals')
@ApiBearerAuth()
@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Post()
  @Roles('user', 'manager', 'admin')
  @ApiOperation({ summary: 'Submit entity for approval' })
  submitForApproval(
    @CurrentUser() user: User, @Body() dto: SubmitApprovalDto,
  ) {
    return this.approvalService.submitForApproval(
      dto.entityType,
      dto.entityId,
      user,
    );
  }

  @Get('my-requests')
  @Roles('user', 'manager', 'admin')
  @ApiOperation({ summary: 'Get my approval requests' })
  getMyRequests(@CurrentUser() user: User) {
    return this.approvalService.getMyRequests(user);
  }

  @Get('pending')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Get pending approvals for current user' })
  getPendingApprovals(@CurrentUser() user: User) {
    return this.approvalService.getPendingApprovals(user);
  }

  @Patch(':id/approve')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Approve a request' })
  approve(@CurrentUser() user: User, @Param('id') id: string) {
    return this.approvalService.approve(id, user);
  }

  @Patch(':id/reject')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Reject a request' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() dto: RejectApprovalDto,
  ) {
    return this.approvalService.reject(id, user, dto.reason);
  }

  @Patch(':id/cancel')
  @Roles('user', 'manager', 'admin')
  @ApiOperation({ summary: 'Cancel own approval request' })
  cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.approvalService.cancel(user, id);
  }
}
