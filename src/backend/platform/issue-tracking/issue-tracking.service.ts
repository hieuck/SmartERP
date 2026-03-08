import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus } from './entities/issue.entity';
import { IssueComment } from './entities/issue-comment.entity';
import { IssueAttachment } from './entities/issue-attachment.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from '../../core/user/entities/user.entity';

@Injectable()
export class IssueTrackingService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssueComment)
    private readonly commentRepository: Repository<IssueComment>,
    @InjectRepository(IssueAttachment)
    private readonly attachmentRepository: Repository<IssueAttachment>,
  ) {}

  async create(user: User, createDto: CreateIssueDto): Promise<Issue> {
    const issue = this.issueRepository.create({
      ...createDto,
      tenantId: user.tenantId,
      reporterId: user.id,
    });

    return await this.issueRepository.save(issue);
  }

  async findAll(
    user: User,
    options: { page?: number; limit?: number; status?: IssueStatus },
  ): Promise<{ data: Issue[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.issueRepository
      .createQueryBuilder('issue')
      .where('issue.tenantId = :tenantId', { tenantId: user.tenantId })
      .orderBy('issue.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (options.status) {
      queryBuilder.andWhere('issue.status = :status', { status: options.status });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(user: User, id: string): Promise<Issue> {
    const issue = await this.issueRepository.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['reporter', 'assignee', 'comments', 'attachments'],
    });

    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    return issue;
  }

  async update(user: User, id: string, updateDto: UpdateIssueDto): Promise<Issue> {
    const issue = await this.findOne(user, id);

    Object.assign(issue, updateDto);

    return await this.issueRepository.save(issue);
  }

  async updateStatus(user: User, id: string, status: IssueStatus): Promise<Issue> {
    const issue = await this.findOne(user, id);

    issue.status = status;

    if (status === IssueStatus.RESOLVED) {
      issue.resolvedAt = new Date();
    }

    if (status === IssueStatus.CLOSED) {
      issue.closedAt = new Date();
    }

    return await this.issueRepository.save(issue);
  }

  async assign(user: User, id: string, assigneeId: string): Promise<Issue> {
    const issue = await this.findOne(user, id);

    issue.assigneeId = assigneeId;

    return await this.issueRepository.save(issue);
  }

  async addComment(user: User, issueId: string, commentDto: CreateCommentDto): Promise<IssueComment> {
    await this.findOne(user, issueId);

    const comment = this.commentRepository.create({
      tenantId: user.tenantId,
      issueId,
      authorId: user.id,
      content: commentDto.content,
      isInternal: commentDto.isInternal || false,
    });

    return await this.commentRepository.save(comment);
  }

  async getComments(user: User, issueId: string): Promise<IssueComment[]> {
    await this.findOne(user, issueId);

    return await this.commentRepository.find({
      where: { issueId, tenantId: user.tenantId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }
}
