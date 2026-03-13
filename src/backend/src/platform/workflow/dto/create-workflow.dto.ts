import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { WorkflowStatus } from '../enums';

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  entityType: string;

  @IsArray()
  steps: Record<string, unknown>[];

  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @IsUUID()
  createdBy: string;
}
