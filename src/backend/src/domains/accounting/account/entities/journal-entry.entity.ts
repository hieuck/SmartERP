import {
  Entity,
  Column,
  Index,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { JournalEntryStatus } from '../enums/journal-entry-status.enum';
import { JournalLine } from './journal-line.entity';

@Entity('journal_entries')
@Index(['tenantId', 'number'], { unique: true })
@Index(['tenantId', 'date'])
export class JournalEntry extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  number: string; // Auto-generated: JE-2026-0001

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference?: string; // External reference (e.g., invoice number)

  @Column({ type: 'text', nullable: true })
  memo?: string;

  @Column({
    type: 'enum',
    enum: JournalEntryStatus,
    default: JournalEntryStatus.DRAFT,
  })
  status: JournalEntryStatus;

  @OneToMany(() => JournalLine, (line) => line.entry, {
    cascade: true,
    eager: true,
  })
  lines: JournalLine[];

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalDebit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCredit: number;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  postedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  postedAt?: Date;

  // Computed fields (like Odoo's @api.depends)
  @BeforeInsert()
  @BeforeUpdate()
  computeTotals() {
    if (this.lines && this.lines.length > 0) {
      this.totalDebit = this.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
      this.totalCredit = this.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
    }
  }

  // Validation (like Odoo's @api.constrains)
  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    // Must have at least 2 lines
    if (!this.lines || this.lines.length < 2) {
      throw new Error('Journal entry must have at least 2 lines');
    }

    // Must be balanced (debit = credit)
    const debit = this.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const credit = this.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);

    if (Math.abs(debit - credit) > 0.01) {
      throw new Error(`Entry must be balanced. Debit: ${debit}, Credit: ${credit}`);
    }

    // Each line must have either debit or credit (not both, not neither)
    this.lines.forEach((line, index) => {
      const lineDebit = Number(line.debit || 0);
      const lineCredit = Number(line.credit || 0);

      if (lineDebit > 0 && lineCredit > 0) {
        throw new Error(`Line ${index + 1}: Cannot have both debit and credit`);
      }
      if (lineDebit === 0 && lineCredit === 0) {
        throw new Error(`Line ${index + 1}: Must have either debit or credit`);
      }
    });
  }
}
