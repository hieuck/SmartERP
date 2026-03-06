import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreatePieceRateWorkDto {
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsString()
  workOrderId?: string;

  @IsDateString()
  workDate: string;

  @IsString()
  taskName: string;

  @IsNumber()
  quantityCompleted: number;

  @IsString()
  unit: string;

  @IsNumber()
  ratePerUnit: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
