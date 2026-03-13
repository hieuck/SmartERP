import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketSatisfactionRating } from '../enums';

export class RateTicketDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: TicketSatisfactionRating;

  @IsOptional()
  @IsString()
  comment?: string;
}
