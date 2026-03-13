import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { JobPriority } from '../enums';

export class CreateBackgroundJobDto {
  @ApiProperty({ example: 'email_batch_send' })
  @IsString()
  jobType: string;

  @ApiPropertyOptional({ example: 'Send monthly newsletter' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: JobPriority, example: JobPriority.NORMAL })
  @IsEnum(JobPriority)
  priority: JobPriority;

  @ApiPropertyOptional({ example: { recipients: ['user@example.com'] } })
  @IsOptional()
  @IsObject()
  payload?: any;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional({ example: '2026-03-10T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
