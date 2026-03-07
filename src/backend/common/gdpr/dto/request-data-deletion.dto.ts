import { IsString, MinLength } from 'class-validator';

export class RequestDataDeletionDto {
  @IsString()
  @MinLength(10, { message: 'Reason must be at least 10 characters' })
  reason: string;
}
