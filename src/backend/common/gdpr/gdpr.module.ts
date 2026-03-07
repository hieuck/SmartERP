import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GdprService } from './gdpr.service';
import { GdprController } from './gdpr.controller';
import { Consent } from './entities/consent.entity';
import { DataExportRequest } from './entities/data-export-request.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Consent,
      DataExportRequest,
      DataDeletionRequest,
    ]),
  ],
  controllers: [GdprController],
  providers: [GdprService],
  exports: [GdprService],
})
export class GdprModule {}
