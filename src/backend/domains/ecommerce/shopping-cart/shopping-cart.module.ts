import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingCart } from './entities/shopping-cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ShoppingCartService } from './shopping-cart.service';
import { ShoppingCartController } from './shopping-cart.controller';
import { ProductCatalogModule } from '../product-catalog/product-catalog.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingCart, CartItem]),
    ProductCatalogModule,
  ],
  controllers: [ShoppingCartController],
  providers: [ShoppingCartService],
  exports: [ShoppingCartService],
})
export class ShoppingCartModule {}
