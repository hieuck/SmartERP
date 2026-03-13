import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consent } from './entities/consent.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';
import { DataExportRequest } from './entities/data-export-request.entity';
import { GdprController } from './gdpr.controller';
import { GdprService } from './gdpr.service';

@Module({
  imports: [TypeOrmModule.forFeature([Consent, DataExportRequest, DataDeletionRequest])],
  controllers: [GdprController],
  providers: [GdprService],
  exports: [GdprService],
})
export class GdprModule {}
