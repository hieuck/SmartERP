import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IssuePriority, IssueStatus, IssueType, TicketChannel } from '../enums';

export class UpdateTicketDto {
  @ApiPropertyOptional({ description: 'Ticket title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Ticket description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: IssueStatus, description: 'Ticket status' })
  @IsEnum(IssueStatus)
  @IsOptional()
  status?: IssueStatus;

  @ApiPropertyOptional({ enum: IssuePriority, description: 'Ticket priority' })
  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @ApiPropertyOptional({ enum: IssueType, description: 'Ticket type' })
  @IsEnum(IssueType)
  @IsOptional()
  type?: IssueType;

  @ApiPropertyOptional({ enum: TicketChannel, description: 'Ticket channel' })
  @IsEnum(TicketChannel)
  @IsOptional()
  channel?: TicketChannel;

  @ApiPropertyOptional({ description: 'SLA ID' })
  @IsString()
  @IsOptional()
  slaId?: string;

  @ApiPropertyOptional({ description: 'Assignee ID' })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Response due at' })
  @IsDateString()
  @IsOptional()
  responseDueAt?: string;

  @ApiPropertyOptional({ description: 'Resolution due at' })
  @IsDateString()
  @IsOptional()
  resolutionDueAt?: string;

  @ApiPropertyOptional({ description: 'Satisfaction rating' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  satisfactionRating?: number;

  @ApiPropertyOptional({ description: 'Satisfaction comment' })
  @IsString()
  @IsOptional()
  satisfactionComment?: string;

  @ApiPropertyOptional({ description: 'Is escalated' })
  @IsBoolean()
  @IsOptional()
  isEscalated?: boolean;

  @ApiPropertyOptional({ description: 'Escalated to ID' })
  @IsString()
  @IsOptional()
  escalatedToId?: string;
}
