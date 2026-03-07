import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FinishProductionDto {
  @ApiProperty({ example: 95, description: 'Actual quantity produced' })
  @IsNumber()
  @Min(0)
  producedQuantity: number;
}
