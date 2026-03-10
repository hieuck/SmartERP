import { IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExecuteReportDto {
  @ApiPropertyOptional({
    example: { status: 'completed', customerId: 'cust-123' },
    description: 'Runtime parameters to override report filters',
  })
  @IsOptional()
  @IsObject()
  parameters?: any;
}
