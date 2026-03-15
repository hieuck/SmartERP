import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class CreateErrorLogDto {
  @ApiProperty({ example: 'ValidationError', description: 'Error type' })
  @IsString()
  errorType: string;

  @ApiProperty({ example: 'Invalid user input', description: 'Error message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: 'Error stack trace...', description: 'Stack trace' })
  @IsOptional()
  @IsString()
  stackTrace?: string;

  @ApiProperty({ example: 'high', enum: ErrorSeverity, description: 'Error severity' })
  @IsEnum(ErrorSeverity)
  severity: ErrorSeverity;

  @ApiPropertyOptional({
    example: { userId: '123', action: 'create' },
    description: 'Additional context',
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @ApiPropertyOptional({ example: '/api/users', description: 'Request path' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ example: 'POST', description: 'HTTP method' })
  @IsOptional()
  @IsString()
  method?: string;
}
