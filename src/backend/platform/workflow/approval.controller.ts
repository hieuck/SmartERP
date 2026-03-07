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
import { ApprovalService } from './approval.service';
import { SubmitApprovalDto, RejectApprovalDto } from './dto/approval.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';

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
    @Body() dto: SubmitApprovalDto,
    @CurrentUser() user: User,
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
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.approvalService.approve(id, user);
  }

  @Patch(':id/reject')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Reject a request' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectApprovalDto,
    @CurrentUser() user: User,
  ) {
    return this.approvalService.reject(id, user, dto.reason);
  }

  @Patch(':id/cancel')
  @Roles('user', 'manager', 'admin')
  @ApiOperation({ summary: 'Cancel own approval request' })
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.approvalService.cancel(id, user);
  }
}
