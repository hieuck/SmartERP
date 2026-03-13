import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { Opportunity } from './entities/opportunity.entity';
import { LeadStatus, OpportunityStage } from './enums';

@Injectable()
export class CrmService {
  private secureLeadRepo: SecureRepository<Lead>;
  private secureOpportunityRepo: SecureRepository<Opportunity>;

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepository: Repository<Opportunity>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureLeadRepo = new SecureRepository(leadRepository, permissionService, 'Lead');
    this.secureOpportunityRepo = new SecureRepository(
      opportunityRepository,
      permissionService,
      'Opportunity',
    );
  }

  // ==================== LEADS ====================

  async findAllLeads(user: User): Promise<Lead[]> {
    return this.secureLeadRepo.find(user, {
      order: { createdAt: 'DESC' },
    });
  }

  async findLeadById(user: User, id: string): Promise<Lead> {
    const cacheKey = generateCacheKey('lead', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const lead = await this.secureLeadRepo.findOne(user, { where: { id } });

        if (!lead) {
          throw new NotFoundException(`Lead with ID ${id} not found`);
        }

        return lead;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findLeadByEmail(user: User, email: string): Promise<Lead | null> {
    return this.secureLeadRepo.findOne(user, {
      where: { email },
    });
  }

  async createLead(user: User, data: Partial<Lead>): Promise<Lead> {
    // Check email uniqueness
    const existingLead = await this.findLeadByEmail(user, data.email);
    if (existingLead) {
      throw new ConflictException(`Lead with email ${data.email} already exists`);
    }

    return this.secureLeadRepo.save(user, data);
  }

  async updateLead(user: User, id: string, data: Partial<Lead>): Promise<Lead> {
    const lead = await this.findLeadById(user, id);

    // Check email uniqueness if being updated
    if (data.email && data.email !== lead.email) {
      const existingLead = await this.findLeadByEmail(user, data.email);
      if (existingLead) {
        throw new ConflictException(`Lead with email ${data.email} already exists`);
      }
    }

    Object.assign(lead, data);
    const updated = await this.secureLeadRepo.save(user, lead);

    // Invalidate cache
    const cacheKey = generateCacheKey('lead', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteLead(user: User, id: string): Promise<void> {
    const lead = await this.findLeadById(user, id);
    await this.secureLeadRepo.remove(user, lead);

    // Invalidate cache
    const cacheKey = generateCacheKey('lead', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findLeadsByStatus(user: User, status: LeadStatus): Promise<Lead[]> {
    return this.secureLeadRepo.find(user, {
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async findLeadsByAssignee(user: User, assignedTo: string): Promise<Lead[]> {
    return this.secureLeadRepo.find(user, {
      where: { assignedTo },
      order: { createdAt: 'DESC' },
    });
  }

  async convertLead(user: User, id: string, customerId: string): Promise<Lead> {
    const lead = await this.findLeadById(user, id);

    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Lead is already converted');
    }

    lead.status = LeadStatus.CONVERTED;
    lead.convertedToCustomerId = customerId;

    return this.secureLeadRepo.save(user, lead);
  }

  async qualifyLead(user: User, id: string): Promise<Lead> {
    const lead = await this.findLeadById(user, id);
    lead.status = LeadStatus.QUALIFIED;
    return this.secureLeadRepo.save(user, lead);
  }

  async disqualifyLead(user: User, id: string): Promise<Lead> {
    const lead = await this.findLeadById(user, id);
    lead.status = LeadStatus.UNQUALIFIED;
    return this.secureLeadRepo.save(user, lead);
  }

  async countLeads(user: User): Promise<number> {
    const leads = await this.secureLeadRepo.find(user, {});
    return leads.length;
  }

  async getLeadStatistics(user: User): Promise<{
    total: number;
    newLeads: number;
    qualified: number;
    converted: number;
    lost: number;
    conversionRate: number;
    totalEstimatedValue: number;
  }> {
    const leads = await this.secureLeadRepo.find(user, {});

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

  async findAllOpportunities(user: User): Promise<Opportunity[]> {
    return this.secureOpportunityRepo.find(user, {
      order: { createdAt: 'DESC' },
    });
  }

  async findOpportunityById(user: User, id: string): Promise<Opportunity> {
    const cacheKey = generateCacheKey('opportunity', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const opportunity = await this.secureOpportunityRepo.findOne(user, { where: { id } });

        if (!opportunity) {
          throw new NotFoundException(`Opportunity with ID ${id} not found`);
        }

        return opportunity;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createOpportunity(user: User, data: Partial<Opportunity>): Promise<Opportunity> {
    return this.secureOpportunityRepo.save(user, data);
  }

  async updateOpportunity(
    user: User,
    id: string,
    data: Partial<Opportunity>,
  ): Promise<Opportunity> {
    const opportunity = await this.findOpportunityById(user, id);
    Object.assign(opportunity, data);
    const updated = await this.secureOpportunityRepo.save(user, opportunity);

    // Invalidate cache
    const cacheKey = generateCacheKey('opportunity', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteOpportunity(user: User, id: string): Promise<void> {
    const opportunity = await this.findOpportunityById(user, id);
    await this.secureOpportunityRepo.remove(user, opportunity);

    // Invalidate cache
    const cacheKey = generateCacheKey('opportunity', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findOpportunitiesByStage(user: User, stage: OpportunityStage): Promise<Opportunity[]> {
    return this.secureOpportunityRepo.find(user, {
      where: { stage },
      order: { createdAt: 'DESC' },
    });
  }

  async findOpportunitiesByCustomer(user: User, customerId: string): Promise<Opportunity[]> {
    return this.secureOpportunityRepo.find(user, {
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async moveOpportunityStage(
    user: User,
    id: string,
    stage: OpportunityStage,
  ): Promise<Opportunity> {
    const opportunity = await this.findOpportunityById(user, id);
    opportunity.stage = stage;
    return this.secureOpportunityRepo.save(user, opportunity);
  }

  async winOpportunity(user: User, id: string): Promise<Opportunity> {
    const opportunity = await this.findOpportunityById(user, id);
    opportunity.stage = OpportunityStage.CLOSED_WON;
    opportunity.probability = 100;
    return this.secureOpportunityRepo.save(user, opportunity);
  }

  async loseOpportunity(user: User, id: string): Promise<Opportunity> {
    const opportunity = await this.findOpportunityById(user, id);
    opportunity.stage = OpportunityStage.CLOSED_LOST;
    opportunity.probability = 0;
    return this.secureOpportunityRepo.save(user, opportunity);
  }

  async countOpportunities(user: User): Promise<number> {
    const opportunities = await this.secureOpportunityRepo.find(user, {});
    return opportunities.length;
  }

  async getOpportunityStatistics(user: User): Promise<{
    total: number;
    active: number;
    won: number;
    lost: number;
    winRate: number;
    totalValue: number;
    wonValue: number;
  }> {
    const opportunities = await this.secureOpportunityRepo.find(user, {});

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

  async getPipeline(user: User): Promise<{
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
    const opportunities = await this.secureOpportunityRepo.find(user, {});

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
