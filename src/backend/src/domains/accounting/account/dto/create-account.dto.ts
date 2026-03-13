import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { AccountType } from '../enums';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AccountType)
  @IsNotEmpty()
  type: AccountType;

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
