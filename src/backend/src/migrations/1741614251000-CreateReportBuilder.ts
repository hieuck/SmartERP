import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateReportBuilder1741614251000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create reports table
    await queryRunner.createTable(
      new Table({
        name: 'reports',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'reference',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            default: "'table'",
          },
          {
            name: 'chartType',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'sourceEntity',
            type: 'varchar',
          },
          {
            name: 'query',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'filters',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'groupBy',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'orderBy',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isPublic',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isScheduled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
          {
            name: 'createdBy',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['tenantId'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['createdBy'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for reports
    await queryRunner.query(`CREATE INDEX "IDX_reports_tenantId" ON "reports" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_reference" ON "reports" ("reference")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_reports_sourceEntity" ON "reports" ("sourceEntity")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_reports_isPublic" ON "reports" ("isPublic")`);

    // Create report_columns table
    await queryRunner.createTable(
      new Table({
        name: 'report_columns',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'reportId',
            type: 'uuid',
          },
          {
            name: 'fieldName',
            type: 'varchar',
          },
          {
            name: 'label',
            type: 'varchar',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            default: "'text'",
          },
          {
            name: 'aggregation',
            type: 'varchar',
            length: '50',
            default: "'none'",
          },
          {
            name: 'width',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'sequence',
            type: 'int',
            default: 0,
          },
          {
            name: 'isVisible',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isSortable',
            type: 'boolean',
            default: true,
          },
          {
            name: 'format',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['reportId'],
            referencedTableName: 'reports',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['tenantId'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for report_columns
    await queryRunner.query(
      `CREATE INDEX "IDX_report_columns_reportId" ON "report_columns" ("reportId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_report_columns_tenantId" ON "report_columns" ("tenantId")`,
    );

    // Create report_executions table
    await queryRunner.createTable(
      new Table({
        name: 'report_executions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'reportId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'parameters',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'result',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'rowCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'executionTime',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
          {
            name: 'executedBy',
            type: 'uuid',
          },
          {
            name: 'executedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['reportId'],
            referencedTableName: 'reports',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['tenantId'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['executedBy'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for report_executions
    await queryRunner.query(
      `CREATE INDEX "IDX_report_executions_reportId" ON "report_executions" ("reportId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_report_executions_tenantId" ON "report_executions" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_report_executions_status" ON "report_executions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_report_executions_executedAt" ON "report_executions" ("executedAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('report_executions', true);
    await queryRunner.dropTable('report_columns', true);
    await queryRunner.dropTable('reports', true);
  }
}
