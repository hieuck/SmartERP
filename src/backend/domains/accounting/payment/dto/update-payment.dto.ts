import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { PaymentMethod, PaymentStatus } from './create-payment.dto';

export class UpdatePaymentDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
