import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
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

  @IsBoolean()
  @IsOptional()
  isGroup?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

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
