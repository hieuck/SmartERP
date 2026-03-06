import { IsOptional, IsString, IsEnum, IsArray } from 'class-validator';

export enum ReportType {
  SALES = 'SALES',
  INVENTORY = 'INVENTORY',
  CUSTOMER = 'CUSTOMER',
  FINANCIAL = 'FINANCIAL',
  PRODUCT = 'PRODUCT',
  ORDER = 'ORDER',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON',
}

export class ReportQueryDto {
  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;

  @IsArray()
  @IsOptional()
  filters?: string[];

  @IsArray()
  @IsOptional()
  groupBy?: string[];

  @IsString()
  @IsOptional()
  sortBy?: string;
}
