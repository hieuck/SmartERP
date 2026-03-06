import { IsString, IsOptional, Matches, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '0901234567',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,11}$/, {
    message: 'Phone number must be 10-11 digits',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}
