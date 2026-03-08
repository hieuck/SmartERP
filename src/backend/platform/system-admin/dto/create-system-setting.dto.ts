import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SettingCategory, SettingType } from '../entities/system-setting.entity';

export class CreateSystemSettingDto {
  @ApiProperty({ example: 'smtp_host' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'smtp.gmail.com' })
  @IsString()
  value: string;

  @ApiProperty({ enum: SettingType, example: SettingType.STRING })
  @IsEnum(SettingType)
  type: SettingType;

  @ApiProperty({ enum: SettingCategory, example: SettingCategory.EMAIL })
  @IsEnum(SettingCategory)
  category: SettingCategory;

  @ApiPropertyOptional({ example: 'SMTP server hostname' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEditable?: boolean;
}
