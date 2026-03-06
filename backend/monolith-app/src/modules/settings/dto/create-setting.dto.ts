import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum SettingCategory {
  GENERAL = 'GENERAL',
  SECURITY = 'SECURITY',
  NOTIFICATION = 'NOTIFICATION',
  PAYMENT = 'PAYMENT',
  SHIPPING = 'SHIPPING',
  TAX = 'TAX',
  EMAIL = 'EMAIL',
  INTEGRATION = 'INTEGRATION',
}

export enum SettingDataType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

export class CreateSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsEnum(SettingCategory)
  @IsNotEmpty()
  category: SettingCategory;

  @IsEnum(SettingDataType)
  @IsOptional()
  dataType?: SettingDataType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
