import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { Permission } from './entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permission]), CacheModule.register()],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService, TypeOrmModule],
})
export class PermissionModule {}
