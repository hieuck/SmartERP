import { IsBoolean, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateErrorLogDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  resolved: boolean;

  @ApiPropertyOptional({ example: 'Fixed by updating database schema' })
  @IsOptional()
  @IsString()
  resolution?: string;
}
