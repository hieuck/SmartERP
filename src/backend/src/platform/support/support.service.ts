import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IssueStatus } from '@platform/issue-tracking/enums/issue-status.enum';
import { TicketChannel, AssignmentStrategy, ArticleStatus } from '@platform/support/enums';
import { User } from '@core/user/entities/user.entity';
import { AssignmentRule } from './entities/assignment-rule.entity';
import { CannedResponse } from './entities/canned-response.entity';
import { KnowledgeBaseArticle } from './entities/knowledge-base-article.entity';
import { SLA } from './entities/sla.entity';
import { Ticket } from './entities/ticket.entity';
import { CreateAssignmentRuleDto } from './dto/create-assignment-rule.dto';
import { CreateCannedResponseDto } from './dto/create-canned-response.dto';
import { CreateKnowledgeBaseArticleDto } from './dto/create-knowledge-base-article.dto';
import { CreateSLADto } from './dto/create-sla.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { RateTicketDto } from './dto/rate-ticket.dto';
import { UpdateAssignmentRuleDto } from './dto/update-assignment-rule.dto';
import { UpdateCannedResponseDto } from './dto/update-canned-response.dto';
import { UpdateKnowledgeBaseArticleDto } from './dto/update-knowledge-base-article.dto';
import { UpdateSLADto } from './dto/update-sla.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(SLA)
    private readonly slaRepository: Repository<SLA>,
    @InjectRepository(AssignmentRule)
    private readonly assignmentRuleRepository: Repository<AssignmentRule>,
    @InjectRepository(KnowledgeBaseArticle)
    private readonly articleRepository: Repository<KnowledgeBaseArticle>,
    @InjectRepository(CannedResponse)
    private readonly cannedResponseRepository: Repository<CannedResponse>,
  ) {}

  // ==================== TICKET OPERATIONS ====================

  async createTicket(user: User, createDto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepository.create({
      ...createDto,
      tenantId: user.tenantId,
      reporterId: user.id,
      customerId: createDto.customerId || user.id,
    });

    // Apply SLA if provided
    if (createDto.slaId) {
      await this.applySLA(ticket, createDto.slaId);
    }

    // Auto-assign based on rules
    if (!createDto.assigneeId) {
      await this.autoAssignTicket(ticket);
    }

    return await this.ticketRepository.save(ticket);
  }

  async findAllTickets(
    user: User,
    options: { page?: number; limit?: number; status?: IssueStatus; channel?: TicketChannel },
  ): Promise<{ data: Ticket[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.tenantId = :tenantId', { tenantId: user.tenantId })
      .orderBy('ticket.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (options.status) {
      queryBuilder.andWhere('ticket.status = :status', { status: options.status });
    }

    if (options.channel) {
      queryBuilder.andWhere('ticket.channel = :channel', { channel: options.channel });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOneTicket(user: User, id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['customer', 'reporter', 'assignee', 'escalatedTo'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async updateTicket(user: User, id: string, updateDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOneTicket(user, id);

    // Store old slaId before updating
    const oldSlaId = ticket.slaId;

    Object.assign(ticket, updateDto);

    // Update SLA due dates if SLA changed
    if (updateDto.slaId && updateDto.slaId !== oldSlaId) {
      await this.applySLA(ticket, updateDto.slaId);
    }

    return await this.ticketRepository.save(ticket);
  }

  async rateTicket(user: User, id: string, rateDto: RateTicketDto): Promise<Ticket> {
    const ticket = await this.findOneTicket(user, id);

    // Only customer can rate
    if (ticket.customerId !== user.id) {
      throw new BadRequestException('Only the customer can rate this ticket');
    }

    // Only closed tickets can be rated
    if (ticket.status !== IssueStatus.CLOSED) {
      throw new BadRequestException('Only closed tickets can be rated');
    }

    ticket.satisfactionRating = rateDto.rating;
    ticket.satisfactionComment = rateDto.comment;

    return await this.ticketRepository.save(ticket);
  }

  async escalateTicket(user: User, id: string, escalatedToId: string): Promise<Ticket> {
    const ticket = await this.findOneTicket(user, id);

    ticket.isEscalated = true;
    ticket.escalatedAt = new Date();
    ticket.escalatedToId = escalatedToId;

    return await this.ticketRepository.save(ticket);
  }

  // ==================== SLA OPERATIONS ====================

  async createSLA(user: User, createDto: CreateSLADto): Promise<SLA> {
    const sla = this.slaRepository.create({
      ...createDto,
      tenantId: user.tenantId,
    });

    return await this.slaRepository.save(sla);
  }

  async findAllSLAs(user: User): Promise<SLA[]> {
    return await this.slaRepository.find({
      where: { tenantId: user.tenantId, isActive: true },
      order: { priority: 'DESC' },
    });
  }

  async findOneSLA(user: User, id: string): Promise<SLA> {
    const sla = await this.slaRepository.findOne({
      where: { id, tenantId: user.tenantId },
    });

    if (!sla) {
      throw new NotFoundException(`SLA with ID ${id} not found`);
    }

    return sla;
  }

  async updateSLA(user: User, id: string, updateDto: UpdateSLADto): Promise<SLA> {
    const sla = await this.findOneSLA(user, id);

    Object.assign(sla, updateDto);

    return await this.slaRepository.save(sla);
  }

  async deleteSLA(user: User, id: string): Promise<void> {
    const sla = await this.findOneSLA(user, id);
    await this.slaRepository.remove(sla);
  }

  private async applySLA(ticket: Ticket, slaId: string): Promise<void> {
    const sla = await this.slaRepository.findOne({
      where: { id: slaId, tenantId: ticket.tenantId },
    });

    if (!sla) {
      throw new NotFoundException(`SLA with ID ${slaId} not found`);
    }

    const now = new Date();
    ticket.slaId = slaId;
    ticket.responseDueAt = new Date(now.getTime() + sla.responseTimeHours * 60 * 60 * 1000);
    ticket.resolutionDueAt = new Date(now.getTime() + sla.resolutionTimeHours * 60 * 60 * 1000);
  }

  // ==================== ASSIGNMENT RULE OPERATIONS ====================

  async createAssignmentRule(user: User, createDto: CreateAssignmentRuleDto): Promise<AssignmentRule> {
    const rule = this.assignmentRuleRepository.create({
      ...createDto,
      tenantId: user.tenantId,
    });

    return await this.assignmentRuleRepository.save(rule);
  }

  async findAllAssignmentRules(user: User): Promise<AssignmentRule[]> {
    return await this.assignmentRuleRepository.find({
      where: { tenantId: user.tenantId, isActive: true },
      order: { priority_order: 'ASC' },
    });
  }

  async findOneAssignmentRule(user: User, id: string): Promise<AssignmentRule> {
    const rule = await this.assignmentRuleRepository.findOne({
      where: { id, tenantId: user.tenantId },
    });

    if (!rule) {
      throw new NotFoundException(`Assignment rule with ID ${id} not found`);
    }

    return rule;
  }

  async updateAssignmentRule(user: User, id: string, updateDto: UpdateAssignmentRuleDto): Promise<AssignmentRule> {
    const rule = await this.findOneAssignmentRule(user, id);

    Object.assign(rule, updateDto);

    return await this.assignmentRuleRepository.save(rule);
  }

  async deleteAssignmentRule(user: User, id: string): Promise<void> {
    const rule = await this.findOneAssignmentRule(user, id);
    await this.assignmentRuleRepository.remove(rule);
  }

  private async autoAssignTicket(ticket: Ticket): Promise<void> {
    const rules = await this.assignmentRuleRepository.find({
      where: {
        tenantId: ticket.tenantId,
        isActive: true,
      },
      order: { priority_order: 'ASC' },
    });

    for (const rule of rules) {
      // Check if rule matches ticket
      if (rule.priority && rule.priority !== ticket.priority) continue;
      if (rule.type && rule.type !== ticket.type) continue;
      if (rule.channel && rule.channel !== ticket.channel) continue;

      // Apply assignment strategy
      if (rule.assigneeIds && rule.assigneeIds.length > 0) {
        ticket.assigneeId = await this.selectAssignee(rule);
        return;
      }
    }
  }

  private async selectAssignee(rule: AssignmentRule): Promise<string> {
    const assigneeIds = rule.assigneeIds;

    switch (rule.strategy) {
      case AssignmentStrategy.ROUND_ROBIN:
        // Simple round-robin: rotate through assignees
        const index = Math.floor(Math.random() * assigneeIds.length);
        return assigneeIds[index];

      case AssignmentStrategy.LEAST_ACTIVE:
        // Find assignee with least active tickets
        const counts = await Promise.all(
          assigneeIds.map(async (assigneeId) => {
            const count = await this.ticketRepository.count({
              where: {
                assigneeId,
                tenantId: rule.tenantId,
                status: In([IssueStatus.NEW, IssueStatus.IN_PROGRESS]),
              },
            });
            return { assigneeId, count };
          }),
        );
        counts.sort((a, b) => a.count - b.count);
        return counts[0].assigneeId;

      case AssignmentStrategy.RANDOM:
        return assigneeIds[Math.floor(Math.random() * assigneeIds.length)];

      case AssignmentStrategy.SKILL_BASED:
        // TODO: Implement skill-based assignment
        return assigneeIds[0];

      default:
        return assigneeIds[0];
    }
  }

  // ==================== KNOWLEDGE BASE OPERATIONS ====================

  async createArticle(user: User, createDto: CreateKnowledgeBaseArticleDto): Promise<KnowledgeBaseArticle> {
    const article = this.articleRepository.create({
      ...createDto,
      tenantId: user.tenantId,
      authorId: user.id,
    });

    return await this.articleRepository.save(article);
  }

  async findAllArticles(
    user: User,
    options: { page?: number; limit?: number; status?: ArticleStatus; search?: string },
  ): Promise<{ data: KnowledgeBaseArticle[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .where('article.tenantId = :tenantId', { tenantId: user.tenantId })
      .orderBy('article.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (options.status) {
      queryBuilder.andWhere('article.status = :status', { status: options.status });
    }

    if (options.search) {
      queryBuilder.andWhere(
        '(article.title ILIKE :search OR article.content ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOneArticle(user: User, id: string): Promise<KnowledgeBaseArticle> {
    const article = await this.articleRepository.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    // Increment view count
    article.viewCount++;
    await this.articleRepository.save(article);

    return article;
  }

  async updateArticle(user: User, id: string, updateDto: UpdateKnowledgeBaseArticleDto): Promise<KnowledgeBaseArticle> {
    const article = await this.findOneArticle(user, id);

    Object.assign(article, updateDto);

    // Set published date if status changed to published
    if (updateDto.status === ArticleStatus.PUBLISHED && !article.publishedAt) {
      article.publishedAt = new Date();
    }

    return await this.articleRepository.save(article);
  }

  async deleteArticle(user: User, id: string): Promise<void> {
    const article = await this.findOneArticle(user, id);
    await this.articleRepository.remove(article);
  }

  async markArticleHelpful(user: User, id: string, helpful: boolean): Promise<KnowledgeBaseArticle> {
    const article = await this.findOneArticle(user, id);

    if (helpful) {
      article.helpfulCount++;
    } else {
      article.notHelpfulCount++;
    }

    return await this.articleRepository.save(article);
  }

  // ==================== CANNED RESPONSE OPERATIONS ====================

  async createCannedResponse(user: User, createDto: CreateCannedResponseDto): Promise<CannedResponse> {
    const response = this.cannedResponseRepository.create({
      ...createDto,
      tenantId: user.tenantId,
      createdById: user.id,
    });

    return await this.cannedResponseRepository.save(response);
  }

  async findAllCannedResponses(user: User, options: { search?: string }): Promise<CannedResponse[]> {
    const queryBuilder = this.cannedResponseRepository
      .createQueryBuilder('response')
      .where('response.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('response.isActive = :isActive', { isActive: true })
      .orderBy('response.usageCount', 'DESC');

    if (options.search) {
      queryBuilder.andWhere(
        '(response.title ILIKE :search OR response.content ILIKE :search OR response.shortcut ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    return await queryBuilder.getMany();
  }

  async findOneCannedResponse(user: User, id: string): Promise<CannedResponse> {
    const response = await this.cannedResponseRepository.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['createdBy'],
    });

    if (!response) {
      throw new NotFoundException(`Canned response with ID ${id} not found`);
    }

    return response;
  }

  async updateCannedResponse(user: User, id: string, updateDto: UpdateCannedResponseDto): Promise<CannedResponse> {
    const response = await this.findOneCannedResponse(user, id);

    Object.assign(response, updateDto);

    return await this.cannedResponseRepository.save(response);
  }

  async deleteCannedResponse(user: User, id: string): Promise<void> {
    const response = await this.findOneCannedResponse(user, id);
    await this.cannedResponseRepository.remove(response);
  }

  async useCannedResponse(user: User, id: string): Promise<CannedResponse> {
    const response = await this.findOneCannedResponse(user, id);

    response.usageCount++;

    return await this.cannedResponseRepository.save(response);
  }
}
