import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityModule } from '@/common/security/security.module';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailLog } from './entities/email-log.entity';
import { CacheModule } from '@/common/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmailTemplate, EmailLog]), CacheModule, SecurityModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
