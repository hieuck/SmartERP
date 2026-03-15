import { IsString, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ConflictResolution {
  KEEP_LOCAL = 'keep_local',
  KEEP_SERVER = 'keep_server',
  MERGE = 'merge',
}

export class ResolveConflictDto {
  @ApiProperty({ description: 'Conflict ID' })
  @IsString()
  conflictId: string;

  @ApiProperty({
    description: 'Resolution strategy',
    enum: ConflictResolution,
  })
  @IsEnum(ConflictResolution)
  resolution: ConflictResolution;

  @ApiProperty({
    description: 'Merged data (required for MERGE strategy)',
    required: false,
  })
  @IsObject()
  mergedData?: unknown;
}
