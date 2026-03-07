import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Please pack carefully' })
  @IsOptional()
  @IsString()
  notes?: string;
}
