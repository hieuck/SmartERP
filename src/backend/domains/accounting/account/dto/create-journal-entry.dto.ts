import { IsDate, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateJournalLineDto } from './create-journal-line.dto';

export class CreateJournalEntryDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  memo?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJournalLineDto)
  lines: CreateJournalLineDto[];
}
