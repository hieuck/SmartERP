import { PartialType } from '@nestjs/swagger';
import { EcommerceCreateProductDto } from './create-product.dto';

export class EcommerceUpdateProductDto extends PartialType(EcommerceCreateProductDto) {}
