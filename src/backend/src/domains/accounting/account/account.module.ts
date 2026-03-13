import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { Invoice } from './entities/invoice.entity';
import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, JournalEntry, Invoice]),
    CacheModule,
    SecurityModule,
  ],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
