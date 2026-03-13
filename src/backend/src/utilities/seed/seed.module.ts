import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '@core/tenant/entities/tenant.entity';
import { User } from '@core/user/entities/user.entity';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User])],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
