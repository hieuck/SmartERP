import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssuePriority, IssueType } from '../../issue-tracking/entities/issue.entity';
import { TicketChannel } from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ description: 'Ticket title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Ticket description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: IssuePriority, description: 'Ticket priority' })
  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @ApiPropertyOptional({ enum: IssueType, description: 'Ticket type' })
  @IsEnum(IssueType)
  @IsOptional()
  type?: IssueType;

  @ApiProperty({ enum: TicketChannel, description: 'Ticket channel' })
  @IsEnum(TicketChannel)
  channel: TicketChannel;

  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional({ description: 'SLA ID' })
  @IsString()
  @IsOptional()
  slaId?: string;

  @ApiPropertyOptional({ description: 'Assignee ID' })
  @IsString()
  @IsOptional()
  assigneeId?: string;
}
