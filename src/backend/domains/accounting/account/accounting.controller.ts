import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AccountType } from './entities/account.entity';
import { InvoiceType } from './entities/invoice.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // Chart of Accounts
  @Get('accounts')
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiQuery({ name: 'type', required: false, enum: AccountType })
  findAllAccounts(@CurrentUser() user: User, @Query('type') type?: AccountType) {
    return this.accountingService.findAllAccounts(user, type);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account by ID' })
  findAccountById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.accountingService.findAccountById(id, user);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create account' })
  createAccount(@Body() data: CreateAccountDto, @CurrentUser() user: User) {
    return this.accountingService.createAccount(data, user);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'Update account' })
  updateAccount(
    @Param('id') id: string,
    @Body() data: UpdateAccountDto,
    @CurrentUser() user: User,
  ) {
    return this.accountingService.updateAccount(id, data, user);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Delete account' })
  deleteAccount(@Param('id') id: string, @CurrentUser() user: User) {
    return this.accountingService.deleteAccount(id, user);
  }

  // Chart of Accounts - Advanced
  @Post('accounts/coa/default')
  @ApiOperation({ summary: 'Create default chart of accounts' })
  createDefaultCOA(@CurrentUser() user: User) {
    return this.accountingService.createDefaultCOA(user);
  }

  @Get('accounts/hierarchy')
  @ApiOperation({ summary: 'Get account hierarchy tree' })
  getAccountHierarchy(@CurrentUser() user: User) {
    return this.accountingService.getAccountHierarchy(user);
  }

  @Get('accounts/validate/:code')
  @ApiOperation({ summary: 'Validate account code uniqueness' })
  validateAccountCode(@Param('code') code: string, @CurrentUser() user: User) {
    return this.accountingService.validateAccountCode(code, user);
  }

  @Get('accounts/by-type/:type')
  @ApiOperation({ summary: 'Get accounts by type' })
  getAccountsByType(@Param('type') type: AccountType, @CurrentUser() user: User) {
    return this.accountingService.getAccountsByType(user, type);
  }

  @Get('accounts/leaf')
  @ApiOperation({ summary: 'Get leaf accounts (non-group)' })
  getLeafAccounts(@CurrentUser() user: User) {
    return this.accountingService.getLeafAccounts(user);
  }

  // Journal Entries
  @Get('journal-entries')
  @ApiOperation({ summary: 'Get all journal entries' })
  findAllJournalEntries(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.accountingService.findAllJournalEntries(user, start, end);
  }

  @Get('journal-entries/:id')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  findJournalEntryById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.accountingService.findJournalEntryById(id, user);
  }

  @Post('journal-entries')
  @ApiOperation({ summary: 'Create journal entry' })
  createJournalEntry(@Body() data: CreateJournalEntryDto, @CurrentUser() user: User) {
    return this.accountingService.createJournalEntry(
      data as unknown as Partial<JournalEntry>, user,
    );
  }

  @Post('journal-entries/:id/post')
  @ApiOperation({ summary: 'Post journal entry' })
  postJournalEntry(@Param('id') id: string, @CurrentUser() user: User) {
    return this.accountingService.postJournalEntry(id, user);
  }

  // Invoices
  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'type', required: false, enum: InvoiceType })
  findAllInvoices(@CurrentUser() user: User, @Query('type') type?: InvoiceType) {
    return this.accountingService.findAllInvoices(user, type);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findInvoiceById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.accountingService.findInvoiceById(id, user);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Create invoice' })
  createInvoice(@Body() data: Record<string, unknown>, @CurrentUser() user: User) {
    return this.accountingService.createInvoice(data, user);
  }

  @Put('invoices/:id')
  @ApiOperation({ summary: 'Update invoice' })
  updateInvoice(
    @Param('id') id: string,
    @Body() data: Record<string, unknown>,
    @CurrentUser() user: User,
  ) {
    return this.accountingService.updateInvoice(id, data, user);
  }

  @Delete('invoices/:id')
  @ApiOperation({ summary: 'Delete invoice' })
  deleteInvoice(@Param('id') id: string, @CurrentUser() user: User) {
    return this.accountingService.deleteInvoice(id, user);
  }

  // Financial Reports
  @Get('reports/balance-sheet')
  @ApiOperation({ summary: 'Get balance sheet' })
  getBalanceSheet(@CurrentUser() user: User, @Query('asOfDate') asOfDate: string) {
    const date = asOfDate ? new Date(asOfDate) : new Date();
    return this.accountingService.getBalanceSheet(user, date);
  }

  @Get('reports/profit-loss')
  @ApiOperation({ summary: 'Get profit and loss statement' })
  getProfitAndLoss(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.accountingService.getProfitAndLoss(user, start, end);
  }
}

  // Journal Entries - New Methods
  @Post('journal-entries/create')
  @ApiOperation({ summary: 'Create journal entry with validation' })
  createJournalEntryNew(
    @Body() dto: any,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    return this.accountingService.createJournalEntry(dto, user, req.user.id);
  }

  @Post('journal-entries/:id/post')
  @ApiOperation({ summary: 'Post journal entry and update balances' })
  postJournalEntryNew(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    return this.accountingService.postJournalEntry(id, user, req.user.id);
  }
}
