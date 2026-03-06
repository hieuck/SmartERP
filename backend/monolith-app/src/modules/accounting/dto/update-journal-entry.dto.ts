import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export class UpdateJournalEntryDto {
  @IsString()
  @IsOptional()
  entryNumber?: string;

  @IsDateString()
  @IsOptional()
  entryDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsArray()
  @IsOptional()
  lines?: Array<{
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
  }>;

  @IsString()
  @IsOptional()
  notes?: string;
}
