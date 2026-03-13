import { PartialType } from '@nestjs/swagger';
import { CreateIssueDto } from './create-issue.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IssueStatus } from '../enums/issue.enum';

export class UpdateIssueDto extends PartialType(CreateIssueDto) {
  @ApiPropertyOptional({ enum: IssueStatus })
  @IsEnum(IssueStatus)
  @IsOptional()
  status?: IssueStatus;
}
