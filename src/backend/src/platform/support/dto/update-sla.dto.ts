import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { IssuePriority } from '@/platform/issue-tracking/enums';

export class UpdateSLADto {
  @ApiPropertyOptional({ description: 'SLA name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'SLA description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Response time in hours' })
  @IsInt()
  @IsOptional()
  @Min(1)
  responseTimeHours?: number;

  @ApiPropertyOptional({ description: 'Resolution time in hours' })
  @IsInt()
  @IsOptional()
  @Min(1)
  resolutionTimeHours?: number;

  @ApiPropertyOptional({ enum: IssuePriority, description: 'Filter by priority' })
  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
