import { IsString, IsNotEmpty, IsArray, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PermissionAction } from '../entities/permission.entity';

export class CreatePermissionDto {
  @ApiProperty({ example: 'products' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({
    example: ['create', 'read', 'update', 'delete'],
    enum: PermissionAction,
    isArray: true,
  })
  @IsArray()
  @IsEnum(PermissionAction, { each: true })
  actions: PermissionAction[];

  @ApiProperty({ example: 'Manage products', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
