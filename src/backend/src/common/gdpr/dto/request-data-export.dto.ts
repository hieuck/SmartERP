import { IsEnum, IsOptional } from 'class-validator';
import { ExportFormat } from '../enums';

export class RequestDataExportDto {
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat = ExportFormat.JSON;
}
