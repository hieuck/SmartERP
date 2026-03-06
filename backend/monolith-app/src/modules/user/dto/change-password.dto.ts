import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldPass123!',
  })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password (min 8 characters, must contain uppercase, lowercase, number)',
    example: 'NewPass123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password',
    example: 'NewPass123!',
  })
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @IsString()
  confirmPassword: string;
}
