import { SecurityModule } from '@/common/security/security.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCatalog } from './entities/product-catalog.entity';
import { ProductCatalogController } from './product-catalog.controller';
import { ProductCatalogService } from './product-catalog.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCatalog]), SecurityModule],
  controllers: [ProductCatalogController],
  providers: [ProductCatalogService],
  exports: [ProductCatalogService, TypeOrmModule],
})
export class ProductCatalogModule {}
