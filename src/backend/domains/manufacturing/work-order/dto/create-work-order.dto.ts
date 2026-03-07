import { IsString, IsNumber, IsDate, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkOrderDto {
  @ApiProperty({ example: 'bom-uuid-123', description: 'BOM ID to manufacture' })
  @IsString()
  bomId: string;

  @ApiProperty({ example: 100, description: 'Quantity to produce' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: '2026-03-15', description: 'Planned start date' })
  @Type(() => Date)
  @IsDate()
  plannedStartDate: Date;

  @ApiPropertyOptional({ example: '2026-03-20', description: 'Planned end date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  plannedEndDate?: Date;

  @ApiPropertyOptional({ example: 'wc-uuid-123', description: 'Work center ID' })
  @IsOptional()
  @IsString()
  workCenterId?: string;
}
