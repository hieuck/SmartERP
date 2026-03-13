import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AssignmentStrategy } from '../enums';
import { IssuePriority, IssueType } from '@/platform/issue-tracking/enums';
import { TicketChannel } from '../enums';

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
