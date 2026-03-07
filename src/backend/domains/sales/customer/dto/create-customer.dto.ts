import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe', description: 'Customer name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Customer email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Customer phone' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'Customer address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'TAX123', description: 'Tax ID' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ example: 10000, description: 'Credit limit' })
  @IsNumber()
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional({ example: 'active', description: 'Customer status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'VIP customer', description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
