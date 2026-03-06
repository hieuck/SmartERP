import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Manager' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Manager role with full access', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['permission-uuid-1', 'permission-uuid-2'], required: false })
  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}
