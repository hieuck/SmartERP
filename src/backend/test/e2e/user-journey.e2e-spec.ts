import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

/**
 * E2E Test Suite: User Journey
 * Based on docs/USER-JOURNEY.md
 *
 * Tests complete user flows from onboarding to daily operations
 */
describe('User Journey E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * PHASE 3: ONBOARDING
   * Week 1: Setup System
   */
  describe('Phase 3: Onboarding - Week 1 Setup', () => {
    describe('Day 1: Registration & Configuration', () => {
      it('should register new tenant (company)', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/tenants/register')
          .send({
            companyName: 'Công Ty Thạch Cao ABC',
            email: 'admin@thachcao-abc.com',
            password: 'SecurePass123!',
            phone: '0901234567',
            address: '123 Đường ABC, Quận 1, TP.HCM',
            taxCode: '0123456789',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        tenantId = response.body.data.tenantId;
        authToken = response.body.data.token;
      });

      it('should login successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'admin@thachcao-abc.com',
            password: 'SecurePass123!',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        authToken = response.body.data.accessToken;
        userId = response.body.data.user.id;
      });

      it('should configure company settings', async () => {
        await request(app.getHttpServer())
          .patch('/api/tenants/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currency: 'VND',
            timezone: 'Asia/Ho_Chi_Minh',
            language: 'vi',
            fiscalYearStart: '01-01',
          })
          .expect(200);
      });

      it('should create warehouse/branch', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/warehouses')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Kho Chính',
            code: 'KHO-01',
            address: '123 Đường ABC, Quận 1, TP.HCM',
            type: 'main',
          })
          .expect(201);

        expect(response.body.data.name).toBe('Kho Chính');
      });
    });

    describe('Day 2: Import Data', () => {
      it('should import products', async () => {
        const products = [
          { sku: 'TC-001', name: 'Tấm Thạch Cao 1.2m', price: 45000, unit: 'tấm' },
          { sku: 'TC-002', name: 'Tấm Thạch Cao 2.4m', price: 85000, unit: 'tấm' },
          { sku: 'KT-001', name: 'Khung Trần C50', price: 12000, unit: 'cây' },
        ];

        for (const product of products) {
          await request(app.getHttpServer())
            .post('/api/products')
            .set('Authorization', `Bearer ${authToken}`)
            .send(product)
            .expect(201);
        }
      });

      it('should import customers', async () => {
        const customers = [
          { name: 'Công Ty XYZ', email: 'xyz@example.com', phone: '0901111111' },
          { name: 'Anh Minh', email: 'minh@example.com', phone: '0902222222' },
        ];

        for (const customer of customers) {
          await request(app.getHttpServer())
            .post('/api/customers')
            .set('Authorization', `Bearer ${authToken}`)
            .send(customer)
            .expect(201);
        }
      });

      it('should import suppliers', async () => {
        await request(app.getHttpServer())
          .post('/api/suppliers')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Nhà Cung Cấp Thạch Cao',
            email: 'supplier@example.com',
            phone: '0903333333',
          })
          .expect(201);
      });

      it('should import initial stock', async () => {
        await request(app.getHttpServer())
          .post('/api/inventory/stock-entry')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            type: 'opening_stock',
            items: [
              { sku: 'TC-001', quantity: 100 },
              { sku: 'TC-002', quantity: 50 },
              { sku: 'KT-001', quantity: 200 },
            ],
          })
          .expect(201);
      });
    });

    describe('Day 3: Create Employee Accounts', () => {
      it('should create accountant user', async () => {
        await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            email: 'ketoan@thachcao-abc.com',
            password: 'KeToan123!',
            firstName: 'Lan',
            lastName: 'Nguyễn',
            role: 'accountant',
          })
          .expect(201);
      });

      it('should create warehouse keeper user', async () => {
        await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            email: 'thukho@thachcao-abc.com',
            password: 'ThuKho123!',
            firstName: 'Hùng',
            lastName: 'Trần',
            role: 'warehouse_keeper',
          })
          .expect(201);
      });

      it('should create sales user', async () => {
        await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            email: 'banhang@thachcao-abc.com',
            password: 'BanHang123!',
            firstName: 'Mai',
            lastName: 'Lê',
            role: 'sales',
          })
          .expect(201);
      });
    });
  });

  /**
   * PHASE 4: DAILY OPERATIONS
   * Morning Routine (8:00 - 12:00)
   */
  describe('Phase 4: Daily Operations - Morning Routine', () => {
    describe('8:00 - 8:30: Check Dashboard', () => {
      it('should get dashboard overview', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('revenue');
        expect(response.body.data).toHaveProperty('newOrders');
        expect(response.body.data).toHaveProperty('lowStockItems');
        expect(response.body.data).toHaveProperty('overdueDebts');
      });

      it('should get notifications', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/notifications')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('8:30 - 9:30: Process New Orders', () => {
      let orderId: string;

      it('should create new sales order', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/sales/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            customerId: 'customer-id-from-import',
            items: [
              { sku: 'TC-001', quantity: 10, price: 45000 },
              { sku: 'KT-001', quantity: 20, price: 12000 },
            ],
            deliveryAddress: '456 Đường XYZ, Quận 2, TP.HCM',
            notes: 'Giao hàng trước 5PM',
          })
          .expect(201);

        orderId = response.body.data.id;
        expect(response.body.data.status).toBe('draft');
      });

      it('should check stock availability', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/inventory/stock')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ sku: 'TC-001' })
          .expect(200);

        expect(response.body.data.quantity).toBeGreaterThanOrEqual(10);
      });

      it('should approve order', async () => {
        await request(app.getHttpServer())
          .patch(`/api/sales/orders/${orderId}/approve`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      });

      it('should print delivery note', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/sales/orders/${orderId}/delivery-note`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('documentUrl');
      });
    });

    describe('9:30 - 10:30: Warehouse Management', () => {
      it('should check current stock', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/inventory/stock')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should approve stock out request', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/inventory/stock-out')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            orderId: 'order-id',
            items: [{ sku: 'TC-001', quantity: 10 }],
          })
          .expect(201);

        expect(response.body.data.status).toBe('approved');
      });

      it('should get low stock items', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/inventory/low-stock')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should create purchase order for low stock', async () => {
        await request(app.getHttpServer())
          .post('/api/purchasing/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            supplierId: 'supplier-id',
            items: [{ sku: 'TC-001', quantity: 100, price: 40000 }],
            expectedDelivery: '2026-03-15',
          })
          .expect(201);
      });
    });

    describe('10:30 - 12:00: Customer Management', () => {
      it('should get overdue debts', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/accounting/debts/overdue')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should create payment receipt', async () => {
        await request(app.getHttpServer())
          .post('/api/accounting/receipts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            customerId: 'customer-id',
            amount: 1000000,
            paymentMethod: 'bank_transfer',
            notes: 'Thanh toán đơn hàng SO-2026-00001',
          })
          .expect(201);
      });

      it('should create quotation for new customer', async () => {
        await request(app.getHttpServer())
          .post('/api/sales/quotations')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            customerId: 'new-customer-id',
            items: [{ sku: 'TC-001', quantity: 50, price: 45000 }],
            validUntil: '2026-03-20',
          })
          .expect(201);
      });
    });
  });

  /**
   * PHASE 4: DAILY OPERATIONS
   * Afternoon Routine (13:00 - 17:00)
   */
  describe('Phase 4: Daily Operations - Afternoon Routine', () => {
    describe('13:00 - 14:00: Process Transactions', () => {
      it('should record payment received', async () => {
        await request(app.getHttpServer())
          .post('/api/accounting/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            type: 'receipt',
            customerId: 'customer-id',
            amount: 500000,
            paymentMethod: 'cash',
          })
          .expect(201);
      });

      it('should update order status to delivered', async () => {
        await request(app.getHttpServer())
          .patch('/api/sales/orders/order-id/status')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: 'delivered' })
          .expect(200);
      });
    });

    describe('15:30 - 17:00: Reports & Analysis', () => {
      it('should get daily revenue report', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/reports/revenue/daily')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ date: '2026-03-09' })
          .expect(200);

        expect(response.body.data).toHaveProperty('totalRevenue');
        expect(response.body.data).toHaveProperty('orderCount');
      });

      it('should get best selling products', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/reports/products/best-selling')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ period: 'month' })
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should get profit report', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/reports/profit')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ startDate: '2026-03-01', endDate: '2026-03-09' })
          .expect(200);

        expect(response.body.data).toHaveProperty('grossProfit');
        expect(response.body.data).toHaveProperty('netProfit');
      });
    });
  });

  /**
   * PHASE 5: GROWTH & OPTIMIZATION
   * Month 4-6: Advanced Features
   */
  describe('Phase 5: Growth - Advanced Features', () => {
    it('should create automated workflow', async () => {
      await request(app.getHttpServer())
        .post('/api/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Auto Approve Small Orders',
          trigger: 'order_created',
          conditions: [{ field: 'totalAmount', operator: 'less_than', value: 5000000 }],
          actions: [{ type: 'approve_order' }, { type: 'create_delivery_note' }],
        })
        .expect(201);
    });

    it('should create custom report', async () => {
      await request(app.getHttpServer())
        .post('/api/reports/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Monthly Sales by Product Category',
          type: 'sales',
          groupBy: 'category',
          period: 'month',
          metrics: ['revenue', 'quantity', 'profit'],
        })
        .expect(201);
    });

    it('should add new branch', async () => {
      await request(app.getHttpServer())
        .post('/api/branches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Chi Nhánh Quận 7',
          address: '789 Đường DEF, Quận 7, TP.HCM',
          phone: '0904444444',
        })
        .expect(201);
    });
  });
});
