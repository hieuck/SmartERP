import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { SettingCategory, SettingDataType } from './create-setting.dto';

export class UpdateSettingDto {
  @IsString()
  @IsOptional()
  value?: string;

  @IsEnum(SettingCategory)
  @IsOptional()
  category?: SettingCategory;

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
