import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class CategoryQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  parentId?: string;
}
