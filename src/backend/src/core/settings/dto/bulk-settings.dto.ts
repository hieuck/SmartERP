import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSettingDto } from './create-setting.dto';

export class BulkSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSettingDto)
  settings: CreateSettingDto[];
}
