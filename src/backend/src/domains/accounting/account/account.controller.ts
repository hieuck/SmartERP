// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { AccountType, InvoiceType } from './enums';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

import { User } from '@/common/security/permission.service';
@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('accounting')
export class AccountController {
  constructor(private readonly accountingService: AccountService) {}

  // Chart of Accounts
  @Get('accounts')
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiQuery({ name: 'type', required: false, enum: AccountType })
  findAllAccounts(@CurrentUser() user: User, @Query('type') type?: AccountType) {
    return this.accountingService.findAllAccounts(user, type);
  }

  // Chart of Accounts - Advanced (must be before :id route)
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
  validateAccountCode(@CurrentUser() user: User, @Param('code') code: string) {
    return this.accountingService.validateAccountCode(user, code);
  }

  @Get('accounts/by-type/:type')
  @ApiOperation({ summary: 'Get accounts by type' })
  getAccountsByType(@CurrentUser() user: User, @Param('type') type: AccountType) {
    return this.accountingService.getAccountsByType(user, type);
  }

  @Get('accounts/leaf')
  @ApiOperation({ summary: 'Get leaf accounts (non-group)' })
  getLeafAccounts(@CurrentUser() user: User) {
    return this.accountingService.getLeafAccounts(user);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account by ID' })
  findAccountById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountingService.findAccountById(user, id);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create account' })
  createAccount(@CurrentUser() user: User, @Body() data: CreateAccountDto) {
    return this.accountingService.createAccount(user, data);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'Update account' })
  updateAccount(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() data: UpdateAccountDto,
  ) {
    return this.accountingService.updateAccount(user, id, data);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Delete account' })
  deleteAccount(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountingService.deleteAccount(user, id);
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
  findJournalEntryById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountingService.findJournalEntryById(user, id);
  }

  @Post('journal-entries')
  @ApiOperation({ summary: 'Create journal entry' })
  createJournalEntry(@CurrentUser() user: User, @Body() data: CreateJournalEntryDto) {
    return this.accountingService.createJournalEntry(user, data);
  }

  @Post('journal-entries/:id/post')
  @ApiOperation({ summary: 'Post journal entry' })
  postJournalEntry(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountingService.postJournalEntry(user, id);
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
  findInvoiceById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountingService.findInvoiceById(user, id);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Create invoice' })
  createInvoice(@CurrentUser() user: User, @Body() data: Record<string, unknown>) {
    return this.accountingService.createInvoice(user, data);
  }

  @Put('invoices/:id')
  @ApiOperation({ summary: 'Update invoice' })
  updateInvoice(
    @Param('id') id: string,
    @Body() data: Record<string, unknown>,
    @CurrentUser() user: User,
  ) {
    return this.accountingService.updateInvoice(user, id, data);
  }

  @Delete('invoices/:id')
  @ApiOperation({ summary: 'Delete invoice' })
  deleteInvoice(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountingService.deleteInvoice(user, id);
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

  // Journal Entries - New Methods
  @Post('journal-entries/create')
  @ApiOperation({ summary: 'Create journal entry with validation' })
  async createJournalEntryNew(@CurrentUser() user: User, @Body() dto: unknown) {
    return this.accountingService.createJournalEntry(user, dto);
  }

  @Post('journal-entries/:id/post')
  @ApiOperation({ summary: 'Post journal entry and update balances' })
  async postJournalEntryNew(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountingService.postJournalEntry(user, id);
  }
}
