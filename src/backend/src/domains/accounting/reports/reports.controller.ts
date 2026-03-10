import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GetTrialBalanceDto } from './dto/get-trial-balance.dto';
import { GetGeneralLedgerDto } from './dto/get-general-ledger.dto';
import { GetCashFlowDto } from './dto/get-cash-flow.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantId } from '@/common/decorators/tenant-id.decorator';

import { User } from '@/common/security/permission.service';
@ApiTags('Accounting Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounting/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get trial balance report' })
  async getTrialBalance(
    @CurrentUser() user: User,
    @Query() dto: GetTrialBalanceDto,
  ) {
    const asOfDate = dto.asOfDate ? new Date(dto.asOfDate) : new Date();
    return this.reportsService.getTrialBalance(user, asOfDate);
  }

  @Get('general-ledger')
  @ApiOperation({ summary: 'Get general ledger report for an account' })
  async getGeneralLedger(
    @CurrentUser() user: User,
    @Query() dto: GetGeneralLedgerDto,
  ) {
    return this.reportsService.getGeneralLedger(
      user,
      dto.accountId,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow statement' })
  async getCashFlow(
    @CurrentUser() user: User,
    @Query() dto: GetCashFlowDto,
  ) {
    return this.reportsService.getCashFlowStatement(
      user,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );
  }
}
