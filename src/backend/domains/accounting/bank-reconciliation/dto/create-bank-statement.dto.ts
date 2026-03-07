import { IsNotEmpty, IsDate, IsNumber, IsArray, ValidateNested, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBankTransactionDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  reference?: string;
}

export class CreateBankStatementDto {
  @IsString()
  @IsNotEmpty()
  bankAccountId: string;

  @IsDate()
  @Type(() => Date)
  statementDate: Date;

  @IsNumber()
  @Min(0)
  openingBalance: number;

  @IsNumber()
  @Min(0)
  closingBalance: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBankTransactionDto)
  transactions: CreateBankTransactionDto[];
}
