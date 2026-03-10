import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddOperationDto {
  @ApiProperty({ example: 'Assembly', description: 'Operation name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Assemble components', description: 'Operation description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'wc-uuid-123', description: 'Work center ID' })
  @IsString()
  workCenterId: string;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ example: 1, description: 'Sequence order' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sequence?: number;
}
