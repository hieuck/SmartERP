import { IsEnum, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ConsentType } from '../entities/consent.entity';

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
