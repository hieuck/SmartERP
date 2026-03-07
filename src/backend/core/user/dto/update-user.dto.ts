import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'user', enum: ['admin', 'manager', 'user'], required: false })
  @IsOptional()
  @IsEnum(['admin', 'manager', 'user'])
  role?: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive', 'suspended'], required: false })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: string;
}
