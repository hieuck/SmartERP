import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BankStatement } from './bank-statement.entity';
import { JournalEntry } from '../../account/entities/journal-entry.entity';

@Entity('bank_transactions')
export class BankTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BankStatement, (stmt) => stmt.transactions, {
    nullable: false,
  })
  @JoinColumn({ name: 'statement_id' })
  statement: BankStatement;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number; // Positive = deposit, Negative = withdrawal

  @Column({ nullable: true })
  reference?: string;

  @ManyToOne(() => JournalEntry, { nullable: true, eager: true })
  @JoinColumn({ name: 'matched_entry_id' })
  matchedEntry?: JournalEntry;

  @Column({ default: false })
  isReconciled: boolean;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
