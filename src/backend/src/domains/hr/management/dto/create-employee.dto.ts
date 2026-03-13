import {
  IsString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentStatus, EmploymentType } from '../../enums/hr.enum';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'john.doe@company.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'EMP-001', description: 'Employee code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeCode?: string;

  @ApiPropertyOptional({ example: 'Engineering', description: 'Department' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ example: 'Software Engineer', description: 'Position' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({
    enum: EmploymentStatus,
    example: EmploymentStatus.ACTIVE,
    description: 'Employment status',
  })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  status?: EmploymentStatus;

  @ApiPropertyOptional({
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
    description: 'Employment type',
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Hire date' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  hireDate?: Date;

  @ApiPropertyOptional({ example: 75000, description: 'Salary' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @ApiPropertyOptional({ example: 'uuid', description: 'Manager ID' })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}
