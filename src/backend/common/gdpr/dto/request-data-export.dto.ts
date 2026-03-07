import { IsEnum, IsOptional } from 'class-validator';
import { ExportFormat } from '../entities/data-export-request.entity';

export class RequestDataExportDto {
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat = ExportFormat.JSON;
}
