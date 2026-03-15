import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Report } from './entities/report.entity';
import { ReportColumn } from './entities/report-column.entity';
import { ReportExecution } from './entities/report-execution.entity';
import { ReportType, AggregationType } from '../enums/platform.enum';
import { ExecutionStatus } from './enums/execution-status.enum';
import { User } from '@/common/security/permission.service';

// Whitelist of allowed aggregation functions (security)
const ALLOWED_AGGREGATIONS = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'];

// Whitelist of allowed operators (security)
const ALLOWED_OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN'];

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(ReportColumn)
    private readonly columnRepository: Repository<ReportColumn>,
    @InjectRepository(ReportExecution)
    private readonly executionRepository: Repository<ReportExecution>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new report definition
   */
  async create(data: Partial<Report>, tenantId: string, user: User): Promise<Report> {
    const report = this.reportRepository.create({
      ...data,
      tenantId,
      createdBy: user.id,
    });

    return this.reportRepository.save(report);
  }

  /**
   * Find report by ID
   */
  async findOne(id: string, tenantId: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id, tenantId },
      relations: ['columns', 'creator'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  /**
   * Find all reports for tenant
   */
  async findAll(tenantId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { tenantId },
      relations: ['columns', 'creator'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find public reports (accessible by all users in tenant)
   */
  async findPublic(tenantId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { tenantId, isPublic: true, isActive: true },
      relations: ['columns'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Update report definition
   */
  async update(id: string, data: Partial<Report>, tenantId: string, _user: User): Promise<Report> {
    const report = await this.findOne(id, tenantId);

    Object.assign(report, data);
    return this.reportRepository.save(report);
  }

  /**
   * Delete report
   */
  async remove(id: string, tenantId: string, _user: User): Promise<void> {
    const report = await this.findOne(id, tenantId);
    await this.reportRepository.remove(report);
  }

  /**
   * Add column to report
   */
  async addColumn(
    reportId: string,
    columnData: Partial<ReportColumn>,
    tenantId: string,
    _user: User,
  ): Promise<ReportColumn> {
    const report = await this.findOne(reportId, tenantId);

    const column = this.columnRepository.create({
      ...columnData,
      reportId: report.id,
      tenantId,
    });

    return this.columnRepository.save(column);
  }

  /**
   * Remove column from report
   */
  async removeColumn(
    reportId: string,
    columnId: string,
    tenantId: string,
    _user: User,
  ): Promise<void> {
    await this.findOne(reportId, tenantId); // Verify report exists

    const column = await this.columnRepository.findOne({
      where: { id: columnId, reportId, tenantId },
    });

    if (!column) {
      throw new NotFoundException(`Column with ID ${columnId} not found`);
    }

    await this.columnRepository.remove(column);
  }

  /**
   * Execute report and return results
   * This is the core method that runs the report query
   */
  async execute(
    reportId: string,
    parameters: unknown,
    tenantId: string,
    user: User,
  ): Promise<ReportExecution> {
    const report = await this.findOne(reportId, tenantId);

    // Create execution record
    const execution = this.executionRepository.create({
      reportId: report.id,
      status: ExecutionStatus.RUNNING,
      parameters,
      tenantId,
      executedBy: user.id,
    });
    await this.executionRepository.save(execution);

    const startTime = Date.now();

    try {
      // Execute query based on report configuration
      const result = await this.executeQuery(report, parameters, tenantId);

      // Update execution with results
      execution.status = ExecutionStatus.COMPLETED;
      execution.result = result;
      execution.rowCount = result.length;
      execution.executionTime = Date.now() - startTime;

      return this.executionRepository.save(execution);
    } catch (error) {
      // Update execution with error
      execution.status = ExecutionStatus.FAILED;
      execution.errorMessage = error.message;
      execution.executionTime = Date.now() - startTime;

      await this.executionRepository.save(execution);
      throw error;
    }
  }

  /**
   * Execute the actual query based on report configuration
   * SECURITY: Uses QueryBuilder to prevent SQL injection
   * SECURITY: Validates all field names and operators
   */
  private async executeQuery(report: Report, parameters: unknown, tenantId: string): Promise<unknown[]> {
    // Validate source entity exists
    let entityMetadata;
    try {
      entityMetadata = this.dataSource.getMetadata(report.sourceEntity);
    } catch (error) {
      throw new BadRequestException(`Invalid source entity: ${report.sourceEntity}`);
    }

    // Build query using QueryBuilder (safe from SQL injection)
    let query = this.dataSource
      .getRepository(report.sourceEntity)
      .createQueryBuilder('entity')
      .where('entity.tenantId = :tenantId', { tenantId });

    // Apply filters from report definition
    if (report.filters && Array.isArray(report.filters)) {
      report.filters.forEach((filter, index) => {
        // Validate field exists in entity
        this.validateFieldName(entityMetadata, filter.field);

        // Validate operator is allowed
        if (!ALLOWED_OPERATORS.includes(filter.operator)) {
          throw new BadRequestException(`Invalid operator: ${filter.operator}`);
        }

        const paramName = `filter_${index}`;
        query = query.andWhere(`entity.${filter.field} ${filter.operator} :${paramName}`, {
          [paramName]: filter.value,
        });
      });
    }

    // Apply runtime parameters (override report filters)
    if (parameters && typeof parameters === 'object') {
      Object.keys(parameters).forEach((key) => {
        // Validate field exists
        this.validateFieldName(entityMetadata, key);
        query = query.andWhere(`entity.${key} = :${key}`, { [key]: parameters[key] });
      });
    }

    // Apply grouping
    if (report.groupBy && report.groupBy.length > 0) {
      report.groupBy.forEach((field) => {
        this.validateFieldName(entityMetadata, field);
        query = query.addGroupBy(`entity.${field}`);
      });
    }

    // Apply sorting
    if (report.orderBy) {
      this.validateFieldName(entityMetadata, report.orderBy.field);
      query = query.orderBy(`entity.${report.orderBy.field}`, report.orderBy.order);
    }

    // Select only specified columns
    if (report.columns && report.columns.length > 0) {
      const selectFields = report.columns
        .filter((col) => col.isVisible)
        .map((col) => {
          // Validate field exists
          this.validateFieldName(entityMetadata, col.fieldName);

          // Apply aggregation if specified
          if (col.aggregation && col.aggregation !== AggregationType.NONE) {
            const aggFunc = col.aggregation.toUpperCase();
            if (!ALLOWED_AGGREGATIONS.includes(aggFunc)) {
              throw new BadRequestException(`Invalid aggregation: ${aggFunc}`);
            }
            return `${aggFunc}(entity.${col.fieldName}) as ${col.fieldName}`;
          }
          return `entity.${col.fieldName}`;
        });

      query = query.select(selectFields);
    }

    // Execute query
    const results = await query.getRawMany();

    return results;
  }

  /**
   * Validate that a field name exists in the entity metadata
   * Prevents SQL injection through field names
   */
  private validateFieldName(entityMetadata: unknown, fieldName: string): void {
    const columns = entityMetadata.columns.map((col: unknown) => col.propertyName);
    if (!columns.includes(fieldName)) {
      throw new BadRequestException(`Invalid field name: ${fieldName}`);
    }
  }

  /**
   * Get execution history for a report
   */
  async getExecutionHistory(
    reportId: string,
    tenantId: string,
    limit: number = 10,
  ): Promise<ReportExecution[]> {
    await this.findOne(reportId, tenantId); // Verify report exists

    return this.executionRepository.find({
      where: { reportId, tenantId },
      relations: ['executor'],
      order: { executedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get execution by ID
   */
  async getExecution(executionId: string, tenantId: string): Promise<ReportExecution> {
    const execution = await this.executionRepository.findOne({
      where: { id: executionId, tenantId },
      relations: ['report', 'executor'],
    });

    if (!execution) {
      throw new NotFoundException(`Execution with ID ${executionId} not found`);
    }

    return execution;
  }
}
