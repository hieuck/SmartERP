import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateBankReconciliation1741423000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create bank_statements table
    await queryRunner.createTable(
      new Table({
        name: 'bank_statements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'number',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'bank_account_id',
            type: 'uuid',
          },
          {
            name: 'statement_date',
            type: 'date',
          },
          {
            name: 'opening_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'closing_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'draft'",
          },
          {
            name: 'tenant_id',
            type: 'varchar',
          },
          {
            name: 'created_by',
            type: 'varchar',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create bank_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'bank_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'statement_id',
            type: 'uuid',
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'description',
            type: 'varchar',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'reference',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'matched_entry_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_reconciled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'tenant_id',
            type: 'varchar',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'bank_statements',
      new TableForeignKey({
        columnNames: ['bank_account_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'accounts',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'bank_transactions',
      new TableForeignKey({
        columnNames: ['statement_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bank_statements',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bank_transactions',
      new TableForeignKey({
        columnNames: ['matched_entry_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'journal_entries',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX idx_bank_statements_tenant ON bank_statements(tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bank_statements_date ON bank_statements(statement_date)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bank_transactions_tenant ON bank_transactions(tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bank_transactions_statement ON bank_transactions(statement_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bank_transactions_reconciled ON bank_transactions(is_reconciled)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bank_transactions_reconciled`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bank_transactions_statement`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bank_transactions_tenant`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bank_statements_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bank_statements_tenant`);

    // Drop foreign keys
    const bankTransactionsTable = await queryRunner.getTable('bank_transactions');
    const matchedEntryFk = bankTransactionsTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('matched_entry_id') !== -1,
    );
    const statementFk = bankTransactionsTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('statement_id') !== -1,
    );
    if (matchedEntryFk) {
      await queryRunner.dropForeignKey('bank_transactions', matchedEntryFk);
    }
    if (statementFk) {
      await queryRunner.dropForeignKey('bank_transactions', statementFk);
    }

    const bankStatementsTable = await queryRunner.getTable('bank_statements');
    const bankAccountFk = bankStatementsTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('bank_account_id') !== -1,
    );
    if (bankAccountFk) {
      await queryRunner.dropForeignKey('bank_statements', bankAccountFk);
    }

    // Drop tables
    await queryRunner.dropTable('bank_transactions');
    await queryRunner.dropTable('bank_statements');
  }
}
