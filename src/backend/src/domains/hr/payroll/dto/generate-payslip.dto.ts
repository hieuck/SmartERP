import { IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePayslipDto {
  @ApiProperty({ example: 'struct-uuid-123' })
  @IsString()
  salaryStructureId: string;

  @ApiProperty({ example: 3, description: 'Month (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026, description: 'Year' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
