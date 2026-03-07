import { IsString, IsEnum, IsOptional, IsNumber, IsArray, IsUUID } from 'class-validator';
import { DocumentType, AccessLevel } from '../entities/document.entity';

export class CreateDocumentDto {
  @IsString()
  name: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  size?: number;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @IsUUID()
  uploadedBy: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
