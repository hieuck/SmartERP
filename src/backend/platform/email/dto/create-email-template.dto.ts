import { IsString, IsEnum, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { TemplateType } from '../entities/email-template.entity';

export class CreateEmailTemplateDto {
  @IsString()
  name: string;

  @IsEnum(TemplateType)
  type: TemplateType;

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
