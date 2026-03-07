import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'CAT-001', description: 'Category code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Electronics', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Electronic products', description: 'Category description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Parent category ID' })
  @IsString()
  @IsOptional()
  parentId?: string;
}
