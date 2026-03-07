import { IsString, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBOMDto {
  @ApiProperty({ example: 'prod-uuid-123', description: 'Product ID to manufacture' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ example: 10, description: 'Quantity to produce' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @ApiPropertyOptional({ example: 'v1.0', description: 'BOM version' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: true, description: 'Is this the active BOM?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'routing-uuid-123', description: 'Routing ID for operations' })
  @IsOptional()
  @IsString()
  routingId?: string;
}
