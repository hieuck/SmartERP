import { IsUUID, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DependencyType } from '../entities/task-dependency.entity';

export class CreateTaskDependencyDto {
  @ApiProperty({ example: 'uuid-of-task' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ example: 'uuid-of-depends-on-task' })
  @IsUUID()
  dependsOnTaskId: string;

  @ApiPropertyOptional({ enum: DependencyType, default: DependencyType.FINISH_TO_START })
  @IsOptional()
  @IsEnum(DependencyType)
  type?: DependencyType;

  @ApiPropertyOptional({ example: 0, description: 'Delay in days (can be negative for lead time)' })
  @IsOptional()
  @IsNumber()
  lagDays?: number;
}
