import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: 'ABC Supplies', description: 'Supplier name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'supplier@example.com', description: 'Supplier email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Supplier phone' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '456 Supply St', description: 'Supplier address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'TAX456', description: 'Tax ID' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ example: 4, description: 'Supplier rating (1-5)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 7, description: 'Lead time in days' })
  @IsNumber()
  @IsOptional()
  leadTime?: number;

  @ApiPropertyOptional({ example: 'Net 30', description: 'Payment terms' })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({ example: 5, description: 'Discount percentage' })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 'active', description: 'Supplier status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Reliable supplier', description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
