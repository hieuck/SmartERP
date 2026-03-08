import { IsString, IsEnum, IsBoolean, IsOptional, IsNotEmpty, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssuePriority, IssueType } from '../../issue-tracking/entities/issue.entity';
import { TicketChannel } from '../entities/ticket.entity';
import { AssignmentStrategy } from '../entities/assignment-rule.entity';

export class CreateAssignmentRuleDto {
  @ApiProperty({ description: 'Rule name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: AssignmentStrategy, description: 'Assignment strategy' })
  @IsEnum(AssignmentStrategy)
  strategy: AssignmentStrategy;

  @ApiPropertyOptional({ enum: IssuePriority, description: 'Filter by priority' })
  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @ApiPropertyOptional({ enum: IssueType, description: 'Filter by type' })
  @IsEnum(IssueType)
  @IsOptional()
  type?: IssueType;

  @ApiPropertyOptional({ enum: TicketChannel, description: 'Filter by channel' })
  @IsEnum(TicketChannel)
  @IsOptional()
  channel?: TicketChannel;

  @ApiProperty({ description: 'Assignee IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  assigneeIds: string[];

  @ApiPropertyOptional({ description: 'Priority order', default: 0 })
  @IsNumber()
  @IsOptional()
  priority_order?: number;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
