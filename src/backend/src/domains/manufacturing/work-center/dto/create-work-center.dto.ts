import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkCenterDto {
  @ApiProperty({ example: 'Assembly Line 1', description: 'Work center name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Main assembly line', description: 'Work center description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 100, description: 'Cost per hour' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerHour?: number;

  @ApiPropertyOptional({ example: 8, description: 'Capacity in hours per day' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;
}
