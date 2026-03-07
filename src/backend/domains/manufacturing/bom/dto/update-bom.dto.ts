import { IsString, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBOMDto {
  @ApiPropertyOptional({ example: 10, description: 'Quantity to produce' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @ApiPropertyOptional({ example: 'v1.1', description: 'BOM version' })
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
