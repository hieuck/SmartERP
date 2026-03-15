import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../../account/entities/account.entity';
import { BankStatementStatus } from '../enums/bank-statement-status.enum';

import { BankTransaction } from './bank-transaction.entity';

@Entity('bank_statements')
export class BankStatement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  number: string; // Auto-generated: BS-2026-0001

  @ManyToOne(() => Account, { nullable: false, eager: true })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount: Account;

  @Column({ type: 'date' })
  statementDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  openingBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  closingBalance: number;

  @OneToMany(() => BankTransaction, (tx) => tx.statement, {
    cascade: true,
    eager: true,
  })
  transactions: BankTransaction[];

  @Column({
    type: 'enum',
    enum: BankStatementStatus,
    default: BankStatementStatus.DRAFT,
  })
  status: BankStatementStatus;

  @Column()
  tenantId: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
