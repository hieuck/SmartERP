import { IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

export class SendEmailDto {
  @IsString()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  cc?: string;

  @IsOptional()
  @IsString()
  bcc?: string;
}

export class SendTemplateEmailDto {
  @IsString()
  to: string;

  @IsUUID()
  templateId: string;

  @IsObject()
  variables: Record<string, string>;
}
