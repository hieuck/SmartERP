import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum SearchType {
  ALL = 'all',
  PRODUCT = 'product',
  CUSTOMER = 'customer',
  ORDER = 'order',
}

export class SearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType;
}
