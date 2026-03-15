import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeDto {
  entity: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  version?: number;
  offlineId?: string;
}

export class PushDto {
  @ApiProperty({
    description: 'Array of changes to push',
    type: [ChangeDto],
  })
  @IsArray()
  changes: ChangeDto[];
}
