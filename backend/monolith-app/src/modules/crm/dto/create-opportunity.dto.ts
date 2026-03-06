import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpportunityStage } from '../entities/opportunity.entity';

export class CreateOpportunityDto {
  @ApiProperty({ example: 'Q1 2024 Deal', description: 'Opportunity name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'uuid', description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 100000, description: 'Deal amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    enum: OpportunityStage,
    example: OpportunityStage.PROSPECTING,
    description: 'Opportunity stage',
  })
  @IsOptional()
  @IsEnum(OpportunityStage)
  stage?: OpportunityStage;

  @ApiPropertyOptional({ example: 75, description: 'Probability (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({ example: '2024-03-31', description: 'Expected close date' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  expectedCloseDate?: Date;

  @ApiPropertyOptional({ example: 'Large enterprise deal', description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Assigned to user ID' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}
