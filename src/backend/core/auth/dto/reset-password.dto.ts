import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token from email',
    example: 'abc123def456',
  })
  @IsNotEmpty({ message: 'Reset token is required' })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password (min 8 characters, must contain uppercase, lowercase, number)',
    example: 'NewSecurePass123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}
