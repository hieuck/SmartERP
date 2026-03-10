import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueStatus, IssuePriority, IssueType } from '../entities/issue.entity';

export class CreateIssueDto {
  @ApiProperty({ example: 'Login button not working' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'When clicking login button, nothing happens' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: IssuePriority, default: IssuePriority.MEDIUM })
  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @ApiPropertyOptional({ enum: IssueType, default: IssueType.TASK })
  @IsEnum(IssueType)
  @IsOptional()
  type?: IssueType;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsString()
  @IsOptional()
  assigneeId?: string;
}
