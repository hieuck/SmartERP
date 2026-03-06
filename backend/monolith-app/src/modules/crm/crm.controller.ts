import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Lead } from './entities/lead.entity';
import { Opportunity } from './entities/opportunity.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // Lead Endpoints
  @Get('leads')
  async findAllLeads(@TenantId() tenantId: string): Promise<Lead[]> {
    return this.crmService.findAllLeads(tenantId);
  }

  @Get('leads/:id')
  async findLeadById(@TenantId() tenantId: string, @Param('id') id: string): Promise<Lead> {
    return this.crmService.findLeadById(tenantId, id);
  }

  @Post('leads')
  async createLead(
    @TenantId() tenantId: string,
    @Body() createLeadDto: CreateLeadDto,
  ): Promise<Lead> {
    return this.crmService.createLead(tenantId, createLeadDto);
  }

  @Put('leads/:id')
  async updateLead(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ): Promise<Lead> {
    return this.crmService.updateLead(tenantId, id, updateLeadDto);
  }

  @Delete('leads/:id')
  async deleteLead(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.crmService.deleteLead(tenantId, id);
  }

  @Post('leads/:id/convert')
  async convertLead(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('customerId') customerId: string,
  ): Promise<Lead> {
    return this.crmService.convertLead(tenantId, id, customerId);
  }

  // Opportunity Endpoints
  @Get('opportunities')
  async findAllOpportunities(@TenantId() tenantId: string): Promise<Opportunity[]> {
    return this.crmService.findAllOpportunities(tenantId);
  }

  @Get('opportunities/:id')
  async findOpportunityById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<Opportunity> {
    return this.crmService.findOpportunityById(tenantId, id);
  }

  @Post('opportunities')
  async createOpportunity(
    @TenantId() tenantId: string,
    @Body() createOpportunityDto: CreateOpportunityDto,
  ): Promise<Opportunity> {
    return this.crmService.createOpportunity(tenantId, createOpportunityDto);
  }

  @Put('opportunities/:id')
  async updateOpportunity(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateOpportunityDto: UpdateOpportunityDto,
  ): Promise<Opportunity> {
    return this.crmService.updateOpportunity(tenantId, id, updateOpportunityDto);
  }

  @Delete('opportunities/:id')
  async deleteOpportunity(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.crmService.deleteOpportunity(tenantId, id);
  }

  @Get('pipeline')
  async getPipeline(@TenantId() tenantId: string): Promise<unknown> {
    return this.crmService.getPipeline(tenantId);
  }
}
