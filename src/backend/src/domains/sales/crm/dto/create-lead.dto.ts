import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { LeadSource } from '../enums/lead-source.enum';
import { LeadStatus } from '../enums/lead-status.enum';

export class CreateLeadDto {
  @ApiProperty({ example: 'John Doe', description: 'Lead name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'ABC Company', description: 'Company name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ enum: LeadStatus, example: LeadStatus.NEW, description: 'Lead status' })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({
    enum: LeadSource,
    example: LeadSource.WEBSITE,
    description: 'Lead source',
  })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({ example: 50000, description: 'Estimated value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional({ example: 'Interested in our products', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Assigned to user ID' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}
