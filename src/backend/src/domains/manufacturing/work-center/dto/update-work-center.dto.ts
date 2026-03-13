import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkCenterDto {
  @ApiPropertyOptional({ example: 'WC001', description: 'Work center code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ example: 'Assembly Line 1', description: 'Work center name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Main assembly line for product A', description: 'Work center description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 95, description: 'Time efficiency percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  timeEfficiency?: number;

  @ApiPropertyOptional({ example: 1, description: 'Capacity per cycle' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  capacityPerCycle?: number;

  @ApiPropertyOptional({ example: 50, description: 'Cost per hour in currency' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerHour?: number;

  @ApiPropertyOptional({ example: true, description: 'Is work center active?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
