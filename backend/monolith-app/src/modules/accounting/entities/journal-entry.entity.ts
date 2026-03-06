import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('journal_entries')
@Index(['tenantId', 'entryNumber'], { unique: true })
@Index(['tenantId', 'entryDate'])
export class JournalEntry extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'entry_number' })
  entryNumber: string;

  @Column({ type: 'date', name: 'entry_date' })
  entryDate: Date;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reference?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_debit' })
  totalDebit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_credit' })
  totalCredit: number;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string; // draft, posted, cancelled

  @Column({ type: 'jsonb', nullable: true })
  lines: Record<string, unknown>; // Array of journal entry lines

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
