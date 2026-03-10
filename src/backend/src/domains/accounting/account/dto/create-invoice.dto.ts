import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType } from '../entities/invoice.entity';

export class InvoiceItemDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsOptional()
  tax?: number;
}

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @IsEnum(InvoiceType)
  type: InvoiceType;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsDateString()
  invoiceDate: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @IsNumber()
  totalAmount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
