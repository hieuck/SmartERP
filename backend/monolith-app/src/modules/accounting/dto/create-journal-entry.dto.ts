import { IsString, IsOptional, IsNotEmpty, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJournalEntryDto {
  @IsString()
  @IsOptional()
  entryNumber?: string;

  @IsDateString()
  @Type(() => Date)
  entryDate: Date;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsArray()
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
  }>;

  @IsString()
  @IsOptional()
  notes?: string;
}
