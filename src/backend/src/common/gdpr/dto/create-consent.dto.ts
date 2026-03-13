import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ConsentType } from '../enums';

export class CreateConsentDto {
  @IsEnum(ConsentType)
  type: ConsentType;

  @IsBoolean()
  granted: boolean;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
