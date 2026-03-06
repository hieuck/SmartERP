import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus, WorkOrderPriority } from '../entities/work-order.entity';

export class CreateWorkOrderDto {
  @ApiProperty({ example: 'WO-001', description: 'Work order number' })
  @IsString()
  @MaxLength(50)
  orderNumber: string;

  @ApiProperty({ example: 'Ceiling Tile Production', description: 'Work order name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Production batch for ceiling tiles',
    description: 'Work order description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid', description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: 'Ceiling Tile', description: 'Product name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  productName?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'BOM ID' })
  @IsOptional()
  @IsUUID()
  bomId?: string;

  @ApiPropertyOptional({ example: 'BOM-001', description: 'BOM code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bomCode?: string;

  @ApiPropertyOptional({
    enum: WorkOrderStatus,
    example: WorkOrderStatus.DRAFT,
    description: 'Work order status',
  })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @ApiPropertyOptional({
    enum: WorkOrderPriority,
    example: WorkOrderPriority.NORMAL,
    description: 'Work order priority',
  })
  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @ApiProperty({ example: 100, description: 'Quantity planned to produce' })
  @IsNumber()
  @Min(0.01)
  quantityPlanned: number;

  @ApiPropertyOptional({ example: 0, description: 'Quantity produced' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityProduced?: number;

  @ApiPropertyOptional({ example: 0, description: 'Quantity rejected' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityRejected?: number;

  @ApiPropertyOptional({ example: 'pcs', description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiPropertyOptional({ example: '2024-02-01', description: 'Planned start date' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  plannedStartDate?: Date;

  @ApiPropertyOptional({ example: '2024-02-05', description: 'Planned end date' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  plannedEndDate?: Date;

  @ApiPropertyOptional({ example: 'uuid', description: 'Assigned to user ID' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Assigned to user name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  assignedToName?: string;

  @ApiPropertyOptional({ example: 'Workstation A', description: 'Workstation' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  workstation?: string;

  @ApiPropertyOptional({ example: 'Rush order', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Created by user ID' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
