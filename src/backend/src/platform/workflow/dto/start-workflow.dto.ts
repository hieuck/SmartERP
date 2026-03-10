import { IsString, IsUUID } from 'class-validator';

export class StartWorkflowDto {
  @IsUUID()
  workflowId: string;

  @IsString()
  entityType: string;

  @IsUUID()
  entityId: string;

  @IsUUID()
  initiatedBy: string;
}
