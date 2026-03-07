import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCatalog } from './entities/product-catalog.entity';
import { ProductCatalogService } from './product-catalog.service';
import { ProductCatalogController } from './product-catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCatalog])],
  controllers: [ProductCatalogController],
  providers: [ProductCatalogService],
  exports: [ProductCatalogService],
})
export class ProductCatalogModule {}
