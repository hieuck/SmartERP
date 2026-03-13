import { IsString, IsNumber, IsDate, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkOrderDto {
  @ApiProperty({ example: 'prod-uuid-123', description: 'Product ID to manufacture' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ example: 'bom-uuid-123', description: 'BOM ID to use (optional)' })
  @IsOptional()
  @IsString()
  bomId?: string;

  @ApiProperty({ example: 100, description: 'Quantity to produce' })
  @IsNumber()
  @Min(0.01)
  qtyToProduce: number;

  @ApiProperty({ example: '2026-03-15T08:00:00Z', description: 'Planned start date' })
  @Type(() => Date)
  @IsDate()
  datePlannedStart: Date;

  @ApiPropertyOptional({ example: '2026-03-20T17:00:00Z', description: 'Planned finish date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  datePlannedFinished?: Date;

  @ApiPropertyOptional({ example: 'user-uuid-123', description: 'Responsible user ID' })
  @IsOptional()
  @IsString()
  responsibleId?: string;

  @ApiPropertyOptional({ example: 'Urgent production order', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
