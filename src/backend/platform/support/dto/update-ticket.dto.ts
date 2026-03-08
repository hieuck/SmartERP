import { IsOptional, IsEnum, IsString, IsBoolean, IsDateString, IsInt, Min, Max } from 'class-validator';
import { IssueStatus, IssuePriority, IssueType } from '../../issue-tracking/entities/issue.entity';
import { TicketChannel, TicketSatisfactionRating } from '../entities/ticket.entity';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsEnum(TicketChannel)
  channel?: TicketChannel;

  @IsOptional()
  @IsString()
  slaId?: string;

  @IsOptional()
  @IsDateString()
  responseDueAt?: Date;

  @IsOptional()
  @IsDateString()
  resolutionDueAt?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  satisfactionRating?: TicketSatisfactionRating;

  @IsOptional()
  @IsString()
  satisfactionComment?: string;

  @IsOptional()
  @IsBoolean()
  isEscalated?: boolean;

  @IsOptional()
  @IsString()
  escalatedToId?: string;
}
