import { IsNotEmpty, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { TicketSatisfactionRating } from '../entities/ticket.entity';

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
