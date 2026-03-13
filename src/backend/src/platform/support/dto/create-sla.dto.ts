import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { IssuePriority } from '@/platform/issue-tracking/enums';

export class CreateSLADto {
  @ApiProperty({ description: 'SLA name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'SLA description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Response time in hours' })
  @IsInt()
  @Min(1)
  responseTimeHours: number;

  @ApiProperty({ description: 'Resolution time in hours' })
  @IsInt()
  @Min(1)
  resolutionTimeHours: number;

  @ApiPropertyOptional({ enum: IssuePriority, description: 'Filter by priority' })
  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @ApiProperty({ description: 'Is active' })
  @IsBoolean()
  isActive: boolean;
}
