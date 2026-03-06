import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsDateString,
} from 'class-validator';
import { InvoiceType } from '../entities/invoice.entity';

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
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;

  @IsString()
  @IsOptional()
  notes?: string;
}
