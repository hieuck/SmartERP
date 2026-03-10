import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum IntegrationType {
  PAYMENT = 'payment',
  SHIPPING = 'shipping',
  ACCOUNTING = 'accounting',
  OTHER = 'other',
}

export class ConfigureIntegrationDto {
  @IsString()
  name: string;

  @IsEnum(IntegrationType)
  type: IntegrationType;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  apiSecret?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
