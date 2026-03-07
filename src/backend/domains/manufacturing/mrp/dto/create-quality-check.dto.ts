import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  IsDateString,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QualityCheckType, QualityCheckResult } from '../entities/quality-check.entity';

export class QualityCheckItemDto {
  @ApiProperty({ example: 'Thickness', description: 'Parameter name' })
  @IsString()
  parameter: string;

  @ApiProperty({ example: '10-12mm', description: 'Specification' })
  @IsString()
  specification: string;

  @ApiProperty({ example: '11mm', description: 'Actual value' })
  @IsString()
  actualValue: string;

  @ApiProperty({ example: 'passed', description: 'Result' })
  @IsString()
  result: string;

  @ApiPropertyOptional({ example: 'Within tolerance', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QualityDefectDto {
  @ApiProperty({ example: 'Surface crack', description: 'Defect type' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'minor', description: 'Severity level' })
  @IsString()
  severity: string;

  @ApiProperty({ example: 5, description: 'Quantity of defects' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'Small cracks on surface', description: 'Defect description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'Top left corner', description: 'Defect location' })
  @IsOptional()
  @IsString()
  location?: string;
}

export class QualityAttachmentDto {
  @ApiProperty({ example: 'inspection-photo.jpg', description: 'Filename' })
  @IsString()
  filename: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', description: 'File URL' })
  @IsString()
  url: string;

  @ApiProperty({ example: 'image/jpeg', description: 'File type' })
  @IsString()
  type: string;
}

export class CreateQualityCheckDto {
  @ApiProperty({ example: 'QC-001', description: 'Quality check number' })
  @IsString()
  @MaxLength(50)
  checkNumber: string;

  @ApiProperty({
    enum: QualityCheckType,
    example: QualityCheckType.FINAL,
    description: 'Quality check type',
  })
  @IsEnum(QualityCheckType)
  type: QualityCheckType;

  @ApiPropertyOptional({ example: 'uuid', description: 'Work order ID' })
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @ApiPropertyOptional({ example: 'WO-001', description: 'Work order number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  workOrderNumber?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Product ID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: 'Ceiling Tile', description: 'Product name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  productName?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Batch ID' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ example: 'BATCH-001', description: 'Batch number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  batchNumber?: string;

  @ApiProperty({ example: '2024-02-01T10:00:00Z', description: 'Check date and time' })
  @IsDateString()
  @Type(() => Date)
  checkDate: Date;

  @ApiProperty({ example: 'uuid', description: 'Inspector user ID' })
  @IsUUID()
  inspectorId: string;

  @ApiProperty({ example: 'John Doe', description: 'Inspector name' })
  @IsString()
  @MaxLength(255)
  inspectorName: string;

  @ApiProperty({ example: 100, description: 'Quantity checked' })
  @IsNumber()
  @Min(0)
  quantityChecked: number;

  @ApiProperty({ example: 95, description: 'Quantity passed' })
  @IsNumber()
  @Min(0)
  quantityPassed: number;

  @ApiProperty({ example: 5, description: 'Quantity failed' })
  @IsNumber()
  @Min(0)
  quantityFailed: number;

  @ApiPropertyOptional({ example: 'pcs', description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiProperty({
    enum: QualityCheckResult,
    example: QualityCheckResult.PASSED,
    description: 'Overall result',
  })
  @IsEnum(QualityCheckResult)
  result: QualityCheckResult;

  @ApiPropertyOptional({ type: [QualityCheckItemDto], description: 'Check items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityCheckItemDto)
  checkItems?: QualityCheckItemDto[];

  @ApiPropertyOptional({ type: [QualityDefectDto], description: 'Defects found' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityDefectDto)
  defects?: QualityDefectDto[];

  @ApiPropertyOptional({ example: 'Overall quality is good', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 'Rework required for failed items',
    description: 'Corrective action',
  })
  @IsOptional()
  @IsString()
  correctiveAction?: string;

  @ApiPropertyOptional({ type: [QualityAttachmentDto], description: 'Attachments' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityAttachmentDto)
  attachments?: QualityAttachmentDto[];

  @ApiPropertyOptional({ example: 'uuid', description: 'Approved by user ID' })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @ApiPropertyOptional({ example: '2024-02-01T12:00:00Z', description: 'Approved at' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  approvedAt?: Date;
}
