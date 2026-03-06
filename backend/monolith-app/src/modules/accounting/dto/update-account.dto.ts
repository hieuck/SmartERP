import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { AccountType } from '../entities/account.entity';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsString()
  @IsOptional()
  parentAccountId?: string;
}
