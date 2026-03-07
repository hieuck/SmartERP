import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Lead } from './entities/lead.entity';
import { Opportunity } from './entities/opportunity.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

import { User } from '@/common/security/permission.service';
@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // Lead Endpoints
  @Get('leads')
  async findAllLeads(@CurrentUser() user: User): Promise<Lead[]> {
    return this.crmService.findAllLeads(user);
  }

  @Get('leads/:id')
  async findLeadById(@CurrentUser() user: User, @Param('id') id: string): Promise<Lead> {
    return this.crmService.findLeadById(user, id);
  }

  @Post('leads')
  async createLead(
    @CurrentUser() user: User,
    @Body() createLeadDto: CreateLeadDto,
  ): Promise<Lead> {
    return this.crmService.createLead(user, createLeadDto);
  }

  @Put('leads/:id')
  async updateLead(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ): Promise<Lead> {
    return this.crmService.updateLead(user, id, updateLeadDto);
  }

  @Delete('leads/:id')
  async deleteLead(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    return this.crmService.deleteLead(user, id);
  }

  @Post('leads/:id/convert')
  async convertLead(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('customerId') customerId: string,
  ): Promise<Lead> {
    return this.crmService.convertLead(user, id, customerId);
  }

  // Opportunity Endpoints
  @Get('opportunities')
  async findAllOpportunities(@CurrentUser() user: User): Promise<Opportunity[]> {
    return this.crmService.findAllOpportunities(user);
  }

  @Get('opportunities/:id')
  async findOpportunityById(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<Opportunity> {
    return this.crmService.findOpportunityById(user, id);
  }

  @Post('opportunities')
  async createOpportunity(
    @CurrentUser() user: User,
    @Body() createOpportunityDto: CreateOpportunityDto,
  ): Promise<Opportunity> {
    return this.crmService.createOpportunity(user, createOpportunityDto);
  }

  @Put('opportunities/:id')
  async updateOpportunity(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateOpportunityDto: UpdateOpportunityDto,
  ): Promise<Opportunity> {
    return this.crmService.updateOpportunity(user, id, updateOpportunityDto);
  }

  @Delete('opportunities/:id')
  async deleteOpportunity(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    return this.crmService.deleteOpportunity(user, id);
  }

  @Get('pipeline')
  async getPipeline(@CurrentUser() user: User): Promise<unknown> {
    return this.crmService.getPipeline(user);
  }
}
