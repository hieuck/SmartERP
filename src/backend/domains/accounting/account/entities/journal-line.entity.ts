import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { JournalEntry } from './journal-entry.entity';
import { Account } from './account.entity';

@Entity('journal_lines')
export class JournalLine extends BaseEntity {
  @ManyToOne(() => JournalEntry, (entry) => entry.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entry_id' })
  entry: JournalEntry;

  @Column({ type: 'uuid', name: 'entry_id' })
  entryId: string;

  @ManyToOne(() => Account, { eager: true })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  credit: number;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
