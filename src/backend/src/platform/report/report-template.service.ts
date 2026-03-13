import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { ReportColumn } from './entities/report-column.entity';
import { ReportType, ChartType, ColumnType, AggregationType } from './enums';
import { User as UserEntity } from '../user/entities/user.entity';
import { User } from '@/common/security/permission.service';

export enum ReportCategory {
  ACCOUNTING = 'accounting',
  INVENTORY = 'inventory',
  SALES = 'sales',
  PURCHASING = 'purchasing',
  HR = 'hr',
  MANUFACTURING = 'manufacturing',
  CRM = 'crm',
}

export interface ReportTemplate {
  name: string;
  description: string;
  category: ReportCategory;
  type: ReportType;
  chartType?: ChartType;
  sourceEntity: string;
  filters?: any[];
  groupBy?: string[];
  orderBy?: any;
  columns: Array<{
    fieldName: string;
    label: string;
    type: ColumnType;
    aggregation?: AggregationType;
    sequence: number;
    format?: string;
  }>;
}

/**
 * ReportTemplateService
 * Manages standard report templates and report library
 */
@Injectable()
export class ReportTemplateService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(ReportColumn)
    private readonly columnRepository: Repository<ReportColumn>,
  ) {}

  /**
   * Get all standard report templates
   */
  getStandardTemplates(): ReportTemplate[] {
    return [
      // ACCOUNTING REPORTS (5)
      {
        name: 'Balance Sheet',
        description: 'Statement of financial position showing assets, liabilities, and equity',
        category: ReportCategory.ACCOUNTING,
        type: ReportType.TABLE,
        sourceEntity: 'Account',
        groupBy: ['type'],
        orderBy: { field: 'code', order: 'ASC' },
        columns: [
          { fieldName: 'code', label: 'Account Code', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'name', label: 'Account Name', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'type', label: 'Type', type: ColumnType.TEXT, sequence: 3 },
          { fieldName: 'balance', label: 'Balance', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 4, format: '0,0.00' },
        ],
      },
      {
        name: 'Profit & Loss Statement',
        description: 'Income statement showing revenue, expenses, and profit',
        category: ReportCategory.ACCOUNTING,
        type: ReportType.TABLE,
        sourceEntity: 'Account',
        filters: [{ field: 'type', operator: 'IN', value: ['income', 'expense'] }],
        groupBy: ['type'],
        orderBy: { field: 'type', order: 'ASC' },
        columns: [
          { fieldName: 'code', label: 'Account Code', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'name', label: 'Account Name', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'balance', label: 'Amount', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 3, format: '0,0.00' },
        ],
      },
      {
        name: 'Cash Flow Statement',
        description: 'Statement of cash flows from operating, investing, and financing activities',
        category: ReportCategory.ACCOUNTING,
        type: ReportType.TABLE,
        sourceEntity: 'JournalEntry',
        filters: [{ field: 'status', operator: '=', value: 'posted' }],
        orderBy: { field: 'date', order: 'DESC' },
        columns: [
          { fieldName: 'date', label: 'Date', type: ColumnType.DATE, sequence: 1 },
          { fieldName: 'reference', label: 'Reference', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'description', label: 'Description', type: ColumnType.TEXT, sequence: 3 },
          { fieldName: 'totalDebit', label: 'Debit', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 4, format: '0,0.00' },
          { fieldName: 'totalCredit', label: 'Credit', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 5, format: '0,0.00' },
        ],
      },
      {
        name: 'Trial Balance',
        description: 'List of all accounts with debit and credit balances',
        category: ReportCategory.ACCOUNTING,
        type: ReportType.TABLE,
        sourceEntity: 'Account',
        orderBy: { field: 'code', order: 'ASC' },
        columns: [
          { fieldName: 'code', label: 'Account Code', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'name', label: 'Account Name', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'debit', label: 'Debit', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 3, format: '0,0.00' },
          { fieldName: 'credit', label: 'Credit', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 4, format: '0,0.00' },
        ],
      },
      {
        name: 'General Ledger',
        description: 'Complete record of all financial transactions',
        category: ReportCategory.ACCOUNTING,
        type: ReportType.TABLE,
        sourceEntity: 'JournalLine',
        orderBy: { field: 'createdAt', order: 'DESC' },
        columns: [
          { fieldName: 'date', label: 'Date', type: ColumnType.DATE, sequence: 1 },
          { fieldName: 'accountCode', label: 'Account', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'description', label: 'Description', type: ColumnType.TEXT, sequence: 3 },
          { fieldName: 'debit', label: 'Debit', type: ColumnType.CURRENCY, sequence: 4, format: '0,0.00' },
          { fieldName: 'credit', label: 'Credit', type: ColumnType.CURRENCY, sequence: 5, format: '0,0.00' },
        ],
      },

      // INVENTORY REPORTS (4)
      {
        name: 'Stock Summary',
        description: 'Current stock levels by product',
        category: ReportCategory.INVENTORY,
        type: ReportType.TABLE,
        sourceEntity: 'Product',
        orderBy: { field: 'name', order: 'ASC' },
        columns: [
          { fieldName: 'code', label: 'Product Code', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'name', label: 'Product Name', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'quantityOnHand', label: 'On Hand', type: ColumnType.NUMBER, aggregation: AggregationType.SUM, sequence: 3 },
          { fieldName: 'quantityReserved', label: 'Reserved', type: ColumnType.NUMBER, aggregation: AggregationType.SUM, sequence: 4 },
          { fieldName: 'quantityAvailable', label: 'Available', type: ColumnType.NUMBER, aggregation: AggregationType.SUM, sequence: 5 },
        ],
      },
      {
        name: 'Stock Valuation',
        description: 'Inventory valuation by product',
        category: ReportCategory.INVENTORY,
        type: ReportType.TABLE,
        sourceEntity: 'Product',
        orderBy: { field: 'name', order: 'ASC' },
        columns: [
          { fieldName: 'code', label: 'Product Code', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'name', label: 'Product Name', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'quantityOnHand', label: 'Quantity', type: ColumnType.NUMBER, aggregation: AggregationType.SUM, sequence: 3 },
          { fieldName: 'costPrice', label: 'Unit Cost', type: ColumnType.CURRENCY, sequence: 4, format: '0,0.00' },
          { fieldName: 'totalValue', label: 'Total Value', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 5, format: '0,0.00' },
        ],
      },
      {
        name: 'Stock Movement',
        description: 'Inventory movements (in/out) by product',
        category: ReportCategory.INVENTORY,
        type: ReportType.TABLE,
        sourceEntity: 'StockMove',
        orderBy: { field: 'date', order: 'DESC' },
        columns: [
          { fieldName: 'date', label: 'Date', type: ColumnType.DATE, sequence: 1 },
          { fieldName: 'productCode', label: 'Product', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'type', label: 'Type', type: ColumnType.TEXT, sequence: 3 },
          { fieldName: 'quantity', label: 'Quantity', type: ColumnType.NUMBER, aggregation: AggregationType.SUM, sequence: 4 },
          { fieldName: 'reference', label: 'Reference', type: ColumnType.TEXT, sequence: 5 },
        ],
      },
      {
        name: 'Low Stock Alert',
        description: 'Products below minimum stock level',
        category: ReportCategory.INVENTORY,
        type: ReportType.TABLE,
        sourceEntity: 'Product',
        filters: [{ field: 'quantityOnHand', operator: '<', value: 'minStockLevel' }],
        orderBy: { field: 'quantityOnHand', order: 'ASC' },
        columns: [
          { fieldName: 'code', label: 'Product Code', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'name', label: 'Product Name', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'quantityOnHand', label: 'Current Stock', type: ColumnType.NUMBER, sequence: 3 },
          { fieldName: 'minStockLevel', label: 'Min Level', type: ColumnType.NUMBER, sequence: 4 },
          { fieldName: 'reorderQuantity', label: 'Reorder Qty', type: ColumnType.NUMBER, sequence: 5 },
        ],
      },

      // SALES REPORTS (4)
      {
        name: 'Sales by Customer',
        description: 'Sales summary grouped by customer',
        category: ReportCategory.SALES,
        type: ReportType.TABLE,
        sourceEntity: 'Order',
        filters: [{ field: 'type', operator: '=', value: 'sale' }],
        groupBy: ['customerId'],
        orderBy: { field: 'totalAmount', order: 'DESC' },
        columns: [
          { fieldName: 'customerName', label: 'Customer', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'orderCount', label: 'Orders', type: ColumnType.NUMBER, aggregation: AggregationType.COUNT, sequence: 2 },
          { fieldName: 'totalAmount', label: 'Total Sales', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 3, format: '0,0.00' },
        ],
      },
      {
        name: 'Sales by Product',
        description: 'Sales summary grouped by product',
        category: ReportCategory.SALES,
        type: ReportType.TABLE,
        sourceEntity: 'OrderLine',
        groupBy: ['productId'],
        orderBy: { field: 'totalAmount', order: 'DESC' },
        columns: [
          { fieldName: 'productCode', label: 'Product Code', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'productName', label: 'Product Name', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'quantity', label: 'Quantity Sold', type: ColumnType.NUMBER, aggregation: AggregationType.SUM, sequence: 3 },
          { fieldName: 'totalAmount', label: 'Total Sales', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 4, format: '0,0.00' },
        ],
      },
      {
        name: 'Sales by Month',
        description: 'Monthly sales trend',
        category: ReportCategory.SALES,
        type: ReportType.CHART,
        chartType: ChartType.LINE,
        sourceEntity: 'Order',
        filters: [{ field: 'type', operator: '=', value: 'sale' }],
        groupBy: ['month', 'year'],
        orderBy: { field: 'date', order: 'ASC' },
        columns: [
          { fieldName: 'month', label: 'Month', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'totalAmount', label: 'Sales', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 2, format: '0,0.00' },
        ],
      },
      {
        name: 'Top 10 Customers',
        description: 'Top 10 customers by sales value',
        category: ReportCategory.SALES,
        type: ReportType.CHART,
        chartType: ChartType.BAR,
        sourceEntity: 'Order',
        filters: [{ field: 'type', operator: '=', value: 'sale' }],
        groupBy: ['customerId'],
        orderBy: { field: 'totalAmount', order: 'DESC' },
        columns: [
          { fieldName: 'customerName', label: 'Customer', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'totalAmount', label: 'Sales', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 2, format: '0,0.00' },
        ],
      },

      // PURCHASING REPORTS (3)
      {
        name: 'Purchase by Supplier',
        description: 'Purchase summary grouped by supplier',
        category: ReportCategory.PURCHASING,
        type: ReportType.TABLE,
        sourceEntity: 'Order',
        filters: [{ field: 'type', operator: '=', value: 'purchase' }],
        groupBy: ['supplierId'],
        orderBy: { field: 'totalAmount', order: 'DESC' },
        columns: [
          { fieldName: 'supplierName', label: 'Supplier', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'orderCount', label: 'Orders', type: ColumnType.NUMBER, aggregation: AggregationType.COUNT, sequence: 2 },
          { fieldName: 'totalAmount', label: 'Total Purchase', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 3, format: '0,0.00' },
        ],
      },
      {
        name: 'Purchase by Product',
        description: 'Purchase summary grouped by product',
        category: ReportCategory.PURCHASING,
        type: ReportType.TABLE,
        sourceEntity: 'OrderLine',
        groupBy: ['productId'],
        orderBy: { field: 'totalAmount', order: 'DESC' },
        columns: [
          { fieldName: 'productCode', label: 'Product Code', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'productName', label: 'Product Name', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'quantity', label: 'Quantity Purchased', type: ColumnType.NUMBER, aggregation: AggregationType.SUM, sequence: 3 },
          { fieldName: 'totalAmount', label: 'Total Cost', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 4, format: '0,0.00' },
        ],
      },
      {
        name: 'Pending Purchase Orders',
        description: 'Purchase orders pending delivery',
        category: ReportCategory.PURCHASING,
        type: ReportType.TABLE,
        sourceEntity: 'Order',
        filters: [
          { field: 'type', operator: '=', value: 'purchase' },
          { field: 'status', operator: 'IN', value: ['confirmed', 'partial'] },
        ],
        orderBy: { field: 'date', order: 'ASC' },
        columns: [
          { fieldName: 'reference', label: 'PO Number', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'supplierName', label: 'Supplier', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'date', label: 'Order Date', type: ColumnType.DATE, sequence: 3 },
          { fieldName: 'totalAmount', label: 'Amount', type: ColumnType.CURRENCY, sequence: 4, format: '0,0.00' },
          { fieldName: 'status', label: 'Status', type: ColumnType.TEXT, sequence: 5 },
        ],
      },

      // HR REPORTS (2)
      {
        name: 'Employee Attendance Summary',
        description: 'Monthly attendance summary by employee',
        category: ReportCategory.HR,
        type: ReportType.TABLE,
        sourceEntity: 'Attendance',
        groupBy: ['employeeId', 'month'],
        orderBy: { field: 'month', order: 'DESC' },
        columns: [
          { fieldName: 'employeeName', label: 'Employee', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'month', label: 'Month', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'daysPresent', label: 'Days Present', type: ColumnType.NUMBER, aggregation: AggregationType.COUNT, sequence: 3 },
          { fieldName: 'hoursWorked', label: 'Hours Worked', type: ColumnType.NUMBER, aggregation: AggregationType.SUM, sequence: 4, format: '0.00' },
        ],
      },
      {
        name: 'Payroll Summary',
        description: 'Monthly payroll summary',
        category: ReportCategory.HR,
        type: ReportType.TABLE,
        sourceEntity: 'Payslip',
        groupBy: ['month', 'year'],
        orderBy: { field: 'year', order: 'DESC' },
        columns: [
          { fieldName: 'month', label: 'Month', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'year', label: 'Year', type: ColumnType.NUMBER, sequence: 2 },
          { fieldName: 'employeeCount', label: 'Employees', type: ColumnType.NUMBER, aggregation: AggregationType.COUNT, sequence: 3 },
          { fieldName: 'grossSalary', label: 'Gross Salary', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 4, format: '0,0.00' },
          { fieldName: 'taxAmount', label: 'Tax', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 5, format: '0,0.00' },
          { fieldName: 'netSalary', label: 'Net Salary', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 6, format: '0,0.00' },
        ],
      },

      // MANUFACTURING REPORTS (2)
      {
        name: 'Work Order Status',
        description: 'Work orders by status',
        category: ReportCategory.MANUFACTURING,
        type: ReportType.TABLE,
        sourceEntity: 'WorkOrder',
        groupBy: ['status'],
        columns: [
          { fieldName: 'status', label: 'Status', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'count', label: 'Count', type: ColumnType.NUMBER, aggregation: AggregationType.COUNT, sequence: 2 },
          { fieldName: 'totalCost', label: 'Total Cost', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 3, format: '0,0.00' },
        ],
      },
      {
        name: 'BOM Cost Analysis',
        description: 'Bill of Materials cost breakdown',
        category: ReportCategory.MANUFACTURING,
        type: ReportType.TABLE,
        sourceEntity: 'BOM',
        orderBy: { field: 'totalCost', order: 'DESC' },
        columns: [
          { fieldName: 'reference', label: 'BOM Reference', type: ColumnType.TEXT, sequence: 1 },
          { fieldName: 'productName', label: 'Product', type: ColumnType.TEXT, sequence: 2 },
          { fieldName: 'quantity', label: 'Quantity', type: ColumnType.NUMBER, sequence: 3 },
          { fieldName: 'materialCost', label: 'Material Cost', type: ColumnType.CURRENCY, sequence: 4, format: '0,0.00' },
          { fieldName: 'laborCost', label: 'Labor Cost', type: ColumnType.CURRENCY, sequence: 5, format: '0,0.00' },
          { fieldName: 'totalCost', label: 'Total Cost', type: ColumnType.CURRENCY, aggregation: AggregationType.SUM, sequence: 6, format: '0,0.00' },
        ],
      },
    ];
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: ReportCategory): ReportTemplate[] {
    return this.getStandardTemplates().filter((t) => t.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): ReportCategory[] {
    return Object.values(ReportCategory);
  }

  /**
   * Create report from template
   */
  async createFromTemplate(
    templateName: string,
    tenantId: string,
    user: User,
  ): Promise<Report> {
    const template = this.getStandardTemplates().find((t) => t.name === templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    // Create report
    const report = this.reportRepository.create({
      name: template.name,
      description: template.description,
      type: template.type,
      chartType: template.chartType,
      sourceEntity: template.sourceEntity,
      filters: template.filters,
      groupBy: template.groupBy,
      orderBy: template.orderBy,
      isPublic: true, // Standard reports are public by default
      tenantId,
      createdBy: user.id,
    });

    const savedReport = await this.reportRepository.save(report);

    // Create columns
    const columns = template.columns.map((col) =>
      this.columnRepository.create({
        ...col,
        reportId: savedReport.id,
        tenantId,
      }),
    );

    await this.columnRepository.save(columns);

    // Reload with columns
    return this.reportRepository.findOne({
      where: { id: savedReport.id, tenantId },
      relations: ['columns'],
    });
  }
}
