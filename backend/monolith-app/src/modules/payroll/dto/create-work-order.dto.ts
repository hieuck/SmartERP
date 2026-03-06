import { IsString, IsNumber, IsDateString, IsOptional, IsArray } from 'class-validator';

export class CreateWorkOrderDto {
  @IsString()
  orderNumber: string;

  @IsString()
  productId: string;

  @IsNumber()
  quantityPlanned: number;

  @IsDateString()
  plannedStartDate: string;

  @IsDateString()
  plannedEndDate: string;

  @IsOptional()
  @IsArray()
  stages?: Array<{
    name: string;
    sequence: number;
    estimatedHours: number;
    assignedWorkers?: string[];
  }>;

  @IsOptional()
  @IsString()
  notes?: string;
}
