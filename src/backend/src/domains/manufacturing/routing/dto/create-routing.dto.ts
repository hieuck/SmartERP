import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoutingDto {
  @ApiProperty({ example: 'Standard Assembly', description: 'Routing name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Standard assembly process', description: 'Routing description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'prod-uuid-123', description: 'Product ID this routing applies to' })
  @IsString()
  productId: string;
}
