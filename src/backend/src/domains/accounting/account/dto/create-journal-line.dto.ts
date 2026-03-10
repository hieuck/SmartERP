import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateJournalLineDto {
  @IsUUID()
  accountId: string;

  @IsNumber()
  @Min(0)
  debit: number;

  @IsNumber()
  @Min(0)
  credit: number;

  @IsString()
  @IsOptional()
  description?: string;
}
