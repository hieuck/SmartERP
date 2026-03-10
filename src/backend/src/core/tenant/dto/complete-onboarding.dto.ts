import { IsEnum, IsNotEmpty, IsOptional, IsArray, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BusinessType {
  MANUFACTURING = 'manufacturing',
  TRADING = 'trading',
  SERVICE = 'service',
}

export enum CompanySize {
  SMALL = '1-10',
  MEDIUM = '11-50',
  LARGE = '51-200',
  ENTERPRISE = '200+',
}

export class CompleteOnboardingDto {
  @ApiProperty({
    description: 'Business type',
    enum: BusinessType,
    example: BusinessType.TRADING,
  })
  @IsNotEmpty()
  @IsEnum(BusinessType)
  businessType: BusinessType;

  @ApiProperty({
    description: 'Company size',
    enum: CompanySize,
    example: CompanySize.SMALL,
  })
  @IsNotEmpty()
  @IsEnum(CompanySize)
  companySize: CompanySize;

  @ApiProperty({
    description: 'Team members to invite (emails)',
    example: ['user1@company.com', 'user2@company.com'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  teamMembers?: string[];

  @ApiProperty({
    description: 'Import data from existing system',
    example: false,
    required: false,
  })
  @IsOptional()
  importData?: boolean;

  @ApiProperty({
    description: 'Data source for import',
    example: 'excel',
    required: false,
  })
  @IsOptional()
  @IsString()
  dataSource?: string;
}
