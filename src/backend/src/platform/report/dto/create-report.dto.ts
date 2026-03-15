import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ChartType, ReportType } from '../enums';

export class CreateReportDto {
  @ApiProperty({ example: 'Monthly Sales Report' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Sales report grouped by month' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ReportType, example: ReportType.TABLE })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional({ enum: ChartType, example: ChartType.BAR })
  @IsOptional()
  @IsEnum(ChartType)
  chartType?: ChartType;

  @ApiProperty({ example: 'Order', description: 'Source entity name' })
  @IsString()
  sourceEntity: string;

  @ApiPropertyOptional({
    example: { type: 'queryBuilder', config: {} },
    description: 'Query configuration',
  })
  @IsOptional()
  @IsObject()
  query?: unknown;

  @ApiPropertyOptional({
    example: [{ field: 'status', operator: '=', value: 'completed' }],
    description: 'Filter configuration',
  })
  @IsOptional()
  @IsArray()
  filters?: unknown[];

  @ApiPropertyOptional({
    example: ['customerId', 'month'],
    description: 'Group by fields',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupBy?: string[];

  @ApiPropertyOptional({
    example: { field: 'createdAt', order: 'DESC' },
    description: 'Sort configuration',
  })
  @IsOptional()
  @IsObject()
  orderBy?: unknown;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isScheduled?: boolean;
}
