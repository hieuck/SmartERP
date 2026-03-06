import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'User password (min 8 characters, must contain uppercase, lowercase, number)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    description: 'Company name',
    example: 'ABC Company Ltd',
  })
  @IsNotEmpty({ message: 'Company name is required' })
  @IsString()
  @MinLength(2, { message: 'Company name must be at least 2 characters long' })
  companyName: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  fullName: string;

  @ApiProperty({
    description: 'Phone number',
    example: '0901234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,11}$/, {
    message: 'Phone number must be 10-11 digits',
  })
  phone?: string;
}
