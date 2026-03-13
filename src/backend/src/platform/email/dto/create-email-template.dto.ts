import { IsString, IsEnum, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { TemplateType } from '../enums/email.enum';

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
