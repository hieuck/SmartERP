import { IsString, IsEmail, IsOptional, IsNumber } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsNumber()
  @IsOptional()
  creditLimit?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
