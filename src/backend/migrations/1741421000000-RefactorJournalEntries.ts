import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class RefactorJournalEntries1741421000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old columns from journal_entries
    await queryRunner.dropColumn('journal_entries', 'entry_number');
    await queryRunner.dropColumn('journal_entries', 'entry_date');
    await queryRunner.dropColumn('journal_entries', 'description');
    await queryRunner.dropColumn('journal_entries', 'notes');
    await queryRunner.dropColumn('journal_entries', 'lines');

    // Add new columns to journal_entries
    await queryRunner.query(`
      ALTER TABLE journal_entries
      ADD COLUMN number VARCHAR(50) NOT NULL,
      ADD COLUMN date DATE NOT NULL,
      ADD COLUMN reference VARCHAR(255),
      ADD COLUMN memo TEXT,
      ADD COLUMN total_debit DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN total_credit DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN created_by UUID NOT NULL,
      ADD COLUMN posted_by UUID,
      ADD COLUMN posted_at TIMESTAMP
    `);

    // Update status column to enum type
    await queryRunner.query(`
      ALTER TABLE journal_entries
      ALTER COLUMN status TYPE VARCHAR(20),
      ALTER COLUMN status SET DEFAULT 'draft'
    `);

    // Create unique index on tenant_id + number
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_journal_entries_tenant_number 
      ON journal_entries(tenant_id, number)
    `);

    // Create index on tenant_id + date
    await queryRunner.query(`
      CREATE INDEX idx_journal_entries_tenant_date 
      ON journal_entries(tenant_id, date)
    `);

    // Create journal_lines table
    await queryRunner.createTable(
      new Table({
        name: 'journal_lines',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'entry_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'account_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'debit',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'credit',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key: journal_lines.entry_id -> journal_entries.id
    await queryRunner.createForeignKey(
      'journal_lines',
      new TableForeignKey({
        columnNames: ['entry_id'],
        referencedTableName: 'journal_entries',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key: journal_lines.account_id -> accounts.id
    await queryRunner.createForeignKey(
      'journal_lines',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop journal_lines table (foreign keys will be dropped automatically)
    await queryRunner.dropTable('journal_lines');

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_journal_entries_tenant_number`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_journal_entries_tenant_date`);

    // Drop new columns from journal_entries
    await queryRunner.dropColumn('journal_entries', 'number');
    await queryRunner.dropColumn('journal_entries', 'date');
    await queryRunner.dropColumn('journal_entries', 'reference');
    await queryRunner.dropColumn('journal_entries', 'memo');
    await queryRunner.dropColumn('journal_entries', 'total_debit');
    await queryRunner.dropColumn('journal_entries', 'total_credit');
    await queryRunner.dropColumn('journal_entries', 'created_by');
    await queryRunner.dropColumn('journal_entries', 'posted_by');
    await queryRunner.dropColumn('journal_entries', 'posted_at');

    // Restore old columns
    await queryRunner.query(`
      ALTER TABLE journal_entries
      ADD COLUMN entry_number VARCHAR(50),
      ADD COLUMN entry_date DATE,
      ADD COLUMN description TEXT,
      ADD COLUMN notes TEXT,
      ADD COLUMN lines JSONB
    `);

    // Restore status column
    await queryRunner.query(`
      ALTER TABLE journal_entries
      ALTER COLUMN status TYPE VARCHAR(20),
      ALTER COLUMN status SET DEFAULT 'draft'
    `);
  }
}
