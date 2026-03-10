import { IsString, IsNumber, IsDate, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalaryStructureDto {
  @ApiProperty({ example: 'emp-uuid-123' })
  @IsString()
  employeeId: string;

  @ApiProperty({ example: 10000000, description: 'Base salary amount' })
  @IsNumber()
  @Min(0)
  baseSalary: number;

  @ApiPropertyOptional({ example: 2000000, description: 'Total allowances' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  allowances?: number;

  @ApiPropertyOptional({ example: 500000, description: 'Total deductions' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductions?: number;

  @ApiProperty({ example: '2026-01-01', description: 'Effective start date' })
  @Type(() => Date)
  @IsDate()
  effectiveFrom: Date;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Effective end date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date;
}
