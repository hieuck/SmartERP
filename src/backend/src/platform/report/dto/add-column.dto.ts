import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AggregationType, ColumnType } from '../enums';

export class AddColumnDto {
  @ApiProperty({ example: 'totalAmount', description: 'Field name from entity' })
  @IsString()
  fieldName: string;

  @ApiProperty({ example: 'Total Amount', description: 'Display label' })
  @IsString()
  label: string;

  @ApiProperty({ enum: ColumnType, example: ColumnType.CURRENCY })
  @IsEnum(ColumnType)
  type: ColumnType;

  @ApiPropertyOptional({ enum: AggregationType, example: AggregationType.SUM })
  @IsOptional()
  @IsEnum(AggregationType)
  aggregation?: AggregationType;

  @ApiPropertyOptional({ example: 150, description: 'Column width in pixels' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ example: 1, description: 'Display order' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sequence?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isSortable?: boolean;

  @ApiPropertyOptional({
    example: '0,0.00',
    description: 'Format string for display',
  })
  @IsOptional()
  @IsString()
  format?: string;
}
