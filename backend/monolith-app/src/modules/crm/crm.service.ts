import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import { Opportunity, OpportunityStage } from './entities/opportunity.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepository: Repository<Opportunity>,
    private readonly cacheService: CacheService,
  ) {}

  // ==================== LEADS ====================

  async findAllLeads(tenantId: string): Promise<Lead[]> {
    return this.leadRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLeadById(tenantId: string, id: string): Promise<Lead> {
    const cacheKey = generateCacheKey('lead', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const lead = await this.leadRepository.findOne({
          where: { id, tenantId },
        });

        if (!lead) {
          throw new NotFoundException(`Lead with ID ${id} not found`);
        }

        return lead;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findLeadByEmail(tenantId: string, email: string): Promise<Lead | null> {
    return this.leadRepository.findOne({
      where: { email, tenantId },
    });
  }

  async createLead(tenantId: string, data: Partial<Lead>): Promise<Lead> {
    // Check email uniqueness
    const existingLead = await this.findLeadByEmail(tenantId, data.email);
    if (existingLead) {
      throw new ConflictException(`Lead with email ${data.email} already exists`);
    }

    const lead = this.leadRepository.create({ ...data, tenantId });
    return this.leadRepository.save(lead);
  }

  async updateLead(tenantId: string, id: string, data: Partial<Lead>): Promise<Lead> {
    const lead = await this.findLeadById(tenantId, id);

    // Check email uniqueness if being updated
    if (data.email && data.email !== lead.email) {
      const existingLead = await this.findLeadByEmail(tenantId, data.email);
      if (existingLead) {
        throw new ConflictException(`Lead with email ${data.email} already exists`);
      }
    }

    Object.assign(lead, data);
    const updated = await this.leadRepository.save(lead);

    // Invalidate cache
    const cacheKey = generateCacheKey('lead', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteLead(tenantId: string, id: string): Promise<void> {
    const lead = await this.findLeadById(tenantId, id);
    await this.leadRepository.softDelete(lead.id);

    // Invalidate cache
    const cacheKey = generateCacheKey('lead', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findLeadsByStatus(tenantId: string, status: LeadStatus): Promise<Lead[]> {
    return this.leadRepository.find({
      where: { tenantId, status },
      order: { createdAt: 'DESC' },
    });
  }

  async findLeadsByAssignee(tenantId: string, assignedTo: string): Promise<Lead[]> {
    return this.leadRepository.find({
      where: { tenantId, assignedTo },
      order: { createdAt: 'DESC' },
    });
  }

  async convertLead(tenantId: string, id: string, customerId: string): Promise<Lead> {
    const lead = await this.findLeadById(tenantId, id);

    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Lead is already converted');
    }

    lead.status = LeadStatus.CONVERTED;
    lead.convertedToCustomerId = customerId;

    return this.leadRepository.save(lead);
  }

  async qualifyLead(tenantId: string, id: string): Promise<Lead> {
    const lead = await this.findLeadById(tenantId, id);
    lead.status = LeadStatus.QUALIFIED;
    return this.leadRepository.save(lead);
  }

  async disqualifyLead(tenantId: string, id: string): Promise<Lead> {
    const lead = await this.findLeadById(tenantId, id);
    lead.status = LeadStatus.UNQUALIFIED;
    return this.leadRepository.save(lead);
  }

  async countLeads(tenantId: string): Promise<number> {
    return this.leadRepository.count({ where: { tenantId } });
  }

  async getLeadStatistics(tenantId: string): Promise<{
    total: number;
    newLeads: number;
    qualified: number;
    converted: number;
    lost: number;
    conversionRate: number;
    totalEstimatedValue: number;
  }> {
    const leads = await this.leadRepository.find({ where: { tenantId } });

    const total = leads.length;
    const newLeads = leads.filter((l) => l.status === LeadStatus.NEW).length;
    const qualified = leads.filter((l) => l.status === LeadStatus.QUALIFIED).length;
    const converted = leads.filter((l) => l.status === LeadStatus.CONVERTED).length;
    const lost = leads.filter((l) => l.status === LeadStatus.LOST).length;

    const totalValue = leads.reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);

    return {
      total,
      newLeads,
      qualified,
      converted,
      lost,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
      totalEstimatedValue: totalValue,
    };
  }

  // ==================== OPPORTUNITIES ====================

  async findAllOpportunities(tenantId: string): Promise<Opportunity[]> {
    return this.opportunityRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOpportunityById(tenantId: string, id: string): Promise<Opportunity> {
    const cacheKey = generateCacheKey('opportunity', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const opportunity = await this.opportunityRepository.findOne({
          where: { id, tenantId },
        });

        if (!opportunity) {
          throw new NotFoundException(`Opportunity with ID ${id} not found`);
        }

        return opportunity;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createOpportunity(tenantId: string, data: Partial<Opportunity>): Promise<Opportunity> {
    const opportunity = this.opportunityRepository.create({
      ...data,
      tenantId,
    });
    return this.opportunityRepository.save(opportunity);
  }

  async updateOpportunity(
    tenantId: string,
    id: string,
    data: Partial<Opportunity>,
  ): Promise<Opportunity> {
    const opportunity = await this.findOpportunityById(tenantId, id);
    Object.assign(opportunity, data);
    const updated = await this.opportunityRepository.save(opportunity);

    // Invalidate cache
    const cacheKey = generateCacheKey('opportunity', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteOpportunity(tenantId: string, id: string): Promise<void> {
    const opportunity = await this.findOpportunityById(tenantId, id);
    await this.opportunityRepository.softDelete(opportunity.id);

    // Invalidate cache
    const cacheKey = generateCacheKey('opportunity', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findOpportunitiesByStage(
    tenantId: string,
    stage: OpportunityStage,
  ): Promise<Opportunity[]> {
    return this.opportunityRepository.find({
      where: { tenantId, stage },
      order: { createdAt: 'DESC' },
    });
  }

  async findOpportunitiesByCustomer(tenantId: string, customerId: string): Promise<Opportunity[]> {
    return this.opportunityRepository.find({
      where: { tenantId, customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async moveOpportunityStage(
    tenantId: string,
    id: string,
    stage: OpportunityStage,
  ): Promise<Opportunity> {
    const opportunity = await this.findOpportunityById(tenantId, id);
    opportunity.stage = stage;
    return this.opportunityRepository.save(opportunity);
  }

  async winOpportunity(tenantId: string, id: string): Promise<Opportunity> {
    const opportunity = await this.findOpportunityById(tenantId, id);
    opportunity.stage = OpportunityStage.CLOSED_WON;
    opportunity.probability = 100;
    return this.opportunityRepository.save(opportunity);
  }

  async loseOpportunity(tenantId: string, id: string): Promise<Opportunity> {
    const opportunity = await this.findOpportunityById(tenantId, id);
    opportunity.stage = OpportunityStage.CLOSED_LOST;
    opportunity.probability = 0;
    return this.opportunityRepository.save(opportunity);
  }

  async countOpportunities(tenantId: string): Promise<number> {
    return this.opportunityRepository.count({ where: { tenantId } });
  }

  async getOpportunityStatistics(tenantId: string): Promise<{
    total: number;
    active: number;
    won: number;
    lost: number;
    winRate: number;
    totalValue: number;
    wonValue: number;
  }> {
    const opportunities = await this.opportunityRepository.find({
      where: { tenantId },
    });

    const total = opportunities.length;
    const won = opportunities.filter((o) => o.stage === OpportunityStage.CLOSED_WON).length;
    const lost = opportunities.filter((o) => o.stage === OpportunityStage.CLOSED_LOST).length;
    const active = total - won - lost;

    const totalValue = opportunities.reduce((sum, o) => sum + Number(o.amount), 0);
    const wonValue = opportunities
      .filter((o) => o.stage === OpportunityStage.CLOSED_WON)
      .reduce((sum, o) => sum + Number(o.amount), 0);

    return {
      total,
      active,
      won,
      lost,
      winRate: total > 0 ? (won / total) * 100 : 0,
      totalValue,
      wonValue,
    };
  }

  async getPipeline(tenantId: string): Promise<{
    pipeline: {
      prospecting: Opportunity[];
      qualification: Opportunity[];
      proposal: Opportunity[];
      negotiation: Opportunity[];
      closedWon: Opportunity[];
      closedLost: Opportunity[];
    };
    summary: {
      prospecting: { count: number; value: number };
      qualification: { count: number; value: number };
      proposal: { count: number; value: number };
      negotiation: { count: number; value: number };
      closedWon: { count: number; value: number };
      closedLost: { count: number; value: number };
    };
  }> {
    const opportunities = await this.opportunityRepository.find({
      where: { tenantId },
    });

    // Group by stage
    const pipeline = {
      prospecting: opportunities.filter((o) => o.stage === OpportunityStage.PROSPECTING),
      qualification: opportunities.filter((o) => o.stage === OpportunityStage.QUALIFICATION),
      proposal: opportunities.filter((o) => o.stage === OpportunityStage.PROPOSAL),
      negotiation: opportunities.filter((o) => o.stage === OpportunityStage.NEGOTIATION),
      closedWon: opportunities.filter((o) => o.stage === OpportunityStage.CLOSED_WON),
      closedLost: opportunities.filter((o) => o.stage === OpportunityStage.CLOSED_LOST),
    };

    return {
      pipeline,
      summary: {
        prospecting: {
          count: pipeline.prospecting.length,
          value: pipeline.prospecting.reduce((sum, o) => sum + Number(o.amount), 0),
        },
        qualification: {
          count: pipeline.qualification.length,
          value: pipeline.qualification.reduce((sum, o) => sum + Number(o.amount), 0),
        },
        proposal: {
          count: pipeline.proposal.length,
          value: pipeline.proposal.reduce((sum, o) => sum + Number(o.amount), 0),
        },
        negotiation: {
          count: pipeline.negotiation.length,
          value: pipeline.negotiation.reduce((sum, o) => sum + Number(o.amount), 0),
        },
        closedWon: {
          count: pipeline.closedWon.length,
          value: pipeline.closedWon.reduce((sum, o) => sum + Number(o.amount), 0),
        },
        closedLost: {
          count: pipeline.closedLost.length,
          value: pipeline.closedLost.reduce((sum, o) => sum + Number(o.amount), 0),
        },
      },
    };
  }
}
