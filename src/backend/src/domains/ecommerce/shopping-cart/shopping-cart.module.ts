import { SecurityModule } from '@/common/security/security.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCatalogModule } from '../product-catalog/product-catalog.module';
import { CartItem } from './entities/cart-item.entity';
import { ShoppingCart } from './entities/shopping-cart.entity';
import { ShoppingCartController } from './shopping-cart.controller';
import { ShoppingCartService } from './shopping-cart.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingCart, CartItem]),
    ProductCatalogModule,
    SecurityModule,
  ],
  controllers: [ShoppingCartController],
  providers: [ShoppingCartService],
  exports: [ShoppingCartService],
})
export class ShoppingCartModule {}
