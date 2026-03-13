import { IsOptional, IsEnum, IsString, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorSeverity } from './create-error-log.dto';

export class ErrorLogFiltersDto {
  @ApiPropertyOptional({ example: 'high', enum: ErrorSeverity, description: 'Filter by severity' })
  @IsOptional()
  @IsEnum(ErrorSeverity)
  severity?: ErrorSeverity;

  @ApiPropertyOptional({ example: 'ValidationError', description: 'Filter by error type' })
  @IsOptional()
  @IsString()
  errorType?: string;

  @ApiPropertyOptional({ example: false, description: 'Filter by resolved status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  resolved?: boolean;

  @ApiPropertyOptional({ example: 10, description: 'Limit number of results' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 0, description: 'Offset for pagination' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
