import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BankReconciliationService } from './bank-reconciliation.service';
import { CreateBankStatementDto } from './dto/create-bank-statement.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';

@ApiTags('Bank Reconciliation')
@ApiBearerAuth()
@Controller('bank-reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankReconciliationController {
  constructor(private readonly bankReconciliationService: BankReconciliationService) {}

  @Post('statements')
  @Roles('accountant', 'manager', 'admin')
  @ApiOperation({ summary: 'Create bank statement' })
  create(@CurrentUser() user: User, @Body() createDto: CreateBankStatementDto) {
    return this.bankReconciliationService.create(createDto, user);
  }

  @Get('statements')
  @Roles('accountant', 'manager', 'admin')
  @ApiOperation({ summary: 'Get all bank statements' })
  findAll(@CurrentUser() user: User) {
    return this.bankReconciliationService.findAll(user);
  }

  @Get('statements/:id')
  @Roles('accountant', 'manager', 'admin')
  @ApiOperation({ summary: 'Get bank statement by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bankReconciliationService.findOne(id, user);
  }

  @Post('statements/:id/auto-match')
  @Roles('accountant', 'manager', 'admin')
  @ApiOperation({ summary: 'Auto-match transactions with journal entries' })
  autoMatch(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bankReconciliationService.autoMatch(id, user);
  }

  @Post('transactions/:transactionId/match/:entryId')
  @Roles('accountant', 'manager', 'admin')
  @ApiOperation({ summary: 'Manually match transaction with journal entry' })
  manualMatch(
    @Param('transactionId') transactionId: string,
    @CurrentUser() user: User,
    @Param('entryId') entryId: string,
  ) {
    return this.bankReconciliationService.manualMatch(transactionId, entryId, user);
  }

  @Patch('transactions/:id/unmatch')
  @Roles('accountant', 'manager', 'admin')
  @ApiOperation({ summary: 'Unmatch a reconciled transaction' })
  unmatch(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bankReconciliationService.unmatch(id, user);
  }

  @Get('statements/:id/report')
  @Roles('accountant', 'manager', 'admin')
  @ApiOperation({ summary: 'Get reconciliation report' })
  getReport(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bankReconciliationService.getReconciliationReport(id, user);
  }
}
