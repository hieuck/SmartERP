import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { IssueStatus } from '@platform/issue-tracking/enums/issue-status.enum';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { ArticleStatus, TicketChannel } from '@platform/support/enums';
import { User } from '@core/user/entities/user.entity';
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
import { SupportService } from './support.service';

@ApiTags('Support & Helpdesk')
@ApiBearerAuth()
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ==================== TICKET ENDPOINTS ====================

  @Post('tickets')
  @Roles('user', 'support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Create a new ticket' })
  async createTicket(@CurrentUser() user: User, @Body() createDto: CreateTicketDto) {
    return await this.supportService.createTicket(user, createDto);
  }

  @Get('tickets')
  @Roles('user', 'support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Get all tickets with pagination and filters' })
  async findAllTickets(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: IssueStatus,
    @Query('channel') channel?: TicketChannel,
  ) {
    return await this.supportService.findAllTickets(user, { page, limit, status, channel });
  }

  @Get('tickets/:id')
  @Roles('user', 'support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Get a ticket by ID' })
  async findOneTicket(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.supportService.findOneTicket(user, id);
  }

  @Put('tickets/:id')
  @Roles('support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Update a ticket' })
  async updateTicket(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateTicketDto,
  ) {
    return await this.supportService.updateTicket(user, id, updateDto);
  }

  @Post('tickets/:id/rate')
  @Roles('user', 'support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Rate a closed ticket (customer only)' })
  async rateTicket(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() rateDto: RateTicketDto,
  ) {
    return await this.supportService.rateTicket(user, id, rateDto);
  }

  @Post('tickets/:id/escalate')
  @Roles('support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Escalate a ticket to another agent' })
  async escalateTicket(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('escalatedToId') escalatedToId: string,
  ) {
    return await this.supportService.escalateTicket(user, id, escalatedToId);
  }

  // ==================== SLA ENDPOINTS ====================

  @Post('slas')
  @Roles('support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Create a new SLA' })
  async createSLA(@CurrentUser() user: User, @Body() createDto: CreateSLADto) {
    return await this.supportService.createSLA(user, createDto);
  }

  @Get('slas')
  @Roles('support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Get all active SLAs' })
  async findAllSLAs(@CurrentUser() user: User) {
    return await this.supportService.findAllSLAs(user);
  }

  @Get('slas/:id')
  @Roles('support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Get an SLA by ID' })
  async findOneSLA(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.supportService.findOneSLA(user, id);
  }

  @Put('slas/:id')
  @Roles('support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Update an SLA' })
  async updateSLA(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateSLADto,
  ) {
    return await this.supportService.updateSLA(user, id, updateDto);
  }

  @Delete('slas/:id')
  @Roles('support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Delete an SLA' })
  async deleteSLA(@CurrentUser() user: User, @Param('id') id: string) {
    await this.supportService.deleteSLA(user, id);
    return { message: 'SLA deleted successfully' };
  }

  // ==================== ASSIGNMENT RULE ENDPOINTS ====================

  @Post('assignment-rules')
  @Roles('support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Create a new assignment rule' })
  async createAssignmentRule(
    @CurrentUser() user: User,
    @Body() createDto: CreateAssignmentRuleDto,
  ) {
    return await this.supportService.createAssignmentRule(user, createDto);
  }

  @Get('assignment-rules')
  @Roles('support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Get all active assignment rules' })
  async findAllAssignmentRules(@CurrentUser() user: User) {
    return await this.supportService.findAllAssignmentRules(user);
  }

  @Get('assignment-rules/:id')
  @Roles('support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Get an assignment rule by ID' })
  async findOneAssignmentRule(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.supportService.findOneAssignmentRule(user, id);
  }

  @Put('assignment-rules/:id')
  @Roles('support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Update an assignment rule' })
  async updateAssignmentRule(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateAssignmentRuleDto,
  ) {
    return await this.supportService.updateAssignmentRule(user, id, updateDto);
  }

  @Delete('assignment-rules/:id')
  @Roles('support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Delete an assignment rule' })
  async deleteAssignmentRule(@CurrentUser() user: User, @Param('id') id: string) {
    await this.supportService.deleteAssignmentRule(user, id);
    return { message: 'Assignment rule deleted successfully' };
  }

  // ==================== KNOWLEDGE BASE ENDPOINTS ====================

  @Post('articles')
  @Roles('support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Create a new knowledge base article' })
  async createArticle(@CurrentUser() user: User, @Body() createDto: CreateKnowledgeBaseArticleDto) {
    return await this.supportService.createArticle(user, createDto);
  }

  @Get('articles')
  @Roles('user', 'support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Get all articles with pagination and filters' })
  async findAllArticles(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ArticleStatus,
    @Query('search') search?: string,
  ) {
    return await this.supportService.findAllArticles(user, { page, limit, status, search });
  }

  @Get('articles/:id')
  @Roles('user', 'support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Get an article by ID (increments view count)' })
  async findOneArticle(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.supportService.findOneArticle(user, id);
  }

  @Put('articles/:id')
  @Roles('support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Update an article' })
  async updateArticle(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateKnowledgeBaseArticleDto,
  ) {
    return await this.supportService.updateArticle(user, id, updateDto);
  }

  @Delete('articles/:id')
  @Roles('support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Delete an article' })
  async deleteArticle(@CurrentUser() user: User, @Param('id') id: string) {
    await this.supportService.deleteArticle(user, id);
    return { message: 'Article deleted successfully' };
  }

  @Post('articles/:id/helpful')
  @Roles('user', 'support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Mark an article as helpful or not helpful' })
  async markArticleHelpful(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('helpful') helpful: boolean,
  ) {
    return await this.supportService.markArticleHelpful(user, id, helpful);
  }

  // ==================== CANNED RESPONSE ENDPOINTS ====================

  @Post('canned-responses')
  @Roles('support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Create a new canned response' })
  async createCannedResponse(
    @CurrentUser() user: User,
    @Body() createDto: CreateCannedResponseDto,
  ) {
    return await this.supportService.createCannedResponse(user, createDto);
  }

  @Get('canned-responses')
  @Roles('support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Get all active canned responses' })
  async findAllCannedResponses(@CurrentUser() user: User, @Query('search') search?: string) {
    return await this.supportService.findAllCannedResponses(user, { search });
  }

  @Get('canned-responses/:id')
  @Roles('support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Get a canned response by ID' })
  async findOneCannedResponse(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.supportService.findOneCannedResponse(user, id);
  }

  @Put('canned-responses/:id')
  @Roles('support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Update a canned response' })
  async updateCannedResponse(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateCannedResponseDto,
  ) {
    return await this.supportService.updateCannedResponse(user, id, updateDto);
  }

  @Delete('canned-responses/:id')
  @Roles('support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Delete a canned response' })
  async deleteCannedResponse(@CurrentUser() user: User, @Param('id') id: string) {
    await this.supportService.deleteCannedResponse(user, id);
    return { message: 'Canned response deleted successfully' };
  }

  @Post('canned-responses/:id/use')
  @Roles('support_agent', 'support_manager', 'manager', 'admin')
  @ApiOperation({ summary: 'Use a canned response (increments usage count)' })
  async useCannedResponse(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.supportService.useCannedResponse(user, id);
  }
}
