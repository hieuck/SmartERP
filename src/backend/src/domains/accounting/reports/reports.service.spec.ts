import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Account } from '../account/entities/account.entity';
import { JournalLine } from '../account/entities/journal-line.entity';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { Customer } from '@/domains/sales/customer/entities/customer.entity';
import { Invoice } from '../account/entities/invoice.entity';
import { Payment } from '../payment/entities/payment.entity';
import { PermissionService, User } from '@/common/security/permission.service';
import { AccountType } from '../account/enums/account-type.enum';

describe('ReportsService', () => {
  let service: ReportsService;
  const mockUser: User = { id: 'user-123', tenantId: 'tenant-123', roles: ['accountant'] };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Account), useValue: { createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(JournalLine), useValue: { createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(Product), useValue: { createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(Customer), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(Invoice), useValue: { createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(Payment), useValue: { find: jest.fn() } },
        { provide: PermissionService, useValue: { hasPermission: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();
    service = module.get<ReportsService>(ReportsService);
    const secureAccountRepo = (service as any).secureAccountRepo;
    secureAccountRepo.find = jest.fn();
    secureAccountRepo.findOne = jest.fn();
  });

  describe('getTrialBalance', () => {
    it('should return trial balance', async () => {
      const mockAccounts = [{ code: '1000', name: 'Cash', type: AccountType.ASSET, balance: '10000', isGroup: false, isActive: true }];
      const secureAccountRepo = (service as any).secureAccountRepo;
      secureAccountRepo.find.mockResolvedValue(mockAccounts);
      const result = await service.getTrialBalance(mockUser, new Date());
      expect(result.accounts).toHaveLength(1);
      expect(result.totalDebit).toBe(10000);
    });
  });

  describe('getCashFlowStatement', () => {
    it('should return cash flow statement', async () => {
      const result = await service.getCashFlowStatement(mockUser, new Date(), new Date());
      expect(result.netCashFlow).toBe(0);
    });
  });
});
