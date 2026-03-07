import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingService } from './accounting.service';
import { Account, AccountType } from './entities/account.entity';
import { CacheService } from '@/common/cache/cache.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('AccountingService - Chart of Accounts', () => {
  let service: AccountingService;
  let accountRepository: jest.Mocked<Repository<Account>>;

  const mockAccountRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockCacheService = {
    getOrSet: jest.fn(),
    del: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
    accountRepository = module.get(getRepositoryToken(Account));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDefaultCOA', () => {
    it('should create default chart of accounts for tenant', async () => {
      const tenantId = 'tenant-123';
      const savedAccounts: Account[] = [];

      mockAccountRepository.create.mockImplementation((data) => data as Account);
      mockAccountRepository.save.mockImplementation((account) => {
        savedAccounts.push(account as Account);
        return Promise.resolve(account as Account);
      });

      await service.createDefaultCOA(tenantId);

      // Should create at least 20 accounts (5 main groups + children)
      expect(savedAccounts.length).toBeGreaterThanOrEqual(20);

      // Check main account groups exist
      const assetGroup = savedAccounts.find((a) => a.code === '1000');
      const liabilityGroup = savedAccounts.find((a) => a.code === '2000');
      const equityGroup = savedAccounts.find((a) => a.code === '3000');
      const incomeGroup = savedAccounts.find((a) => a.code === '4000');
      const expenseGroup = savedAccounts.find((a) => a.code === '5000');

      expect(assetGroup).toBeDefined();
      expect(assetGroup?.name).toBe('Assets');
      expect(assetGroup?.type).toBe(AccountType.ASSET);
      expect(assetGroup?.isGroup).toBe(true);

      expect(liabilityGroup).toBeDefined();
      expect(liabilityGroup?.name).toBe('Liabilities');
      expect(liabilityGroup?.type).toBe(AccountType.LIABILITY);
      expect(liabilityGroup?.isGroup).toBe(true);

      expect(equityGroup).toBeDefined();
      expect(incomeGroup).toBeDefined();
      expect(expenseGroup).toBeDefined();
    });

    it('should create hierarchical structure with parent relationships', async () => {
      const tenantId = 'tenant-123';
      const savedAccounts: Account[] = [];

      mockAccountRepository.create.mockImplementation((data) => data as Account);
      mockAccountRepository.save.mockImplementation((account) => {
        savedAccounts.push(account as Account);
        return Promise.resolve(account as Account);
      });

      await service.createDefaultCOA(tenantId);

      // Check child accounts have parent references
      const currentAssets = savedAccounts.find((a) => a.code === '1100');
      expect(currentAssets).toBeDefined();
      expect(currentAssets?.parentId).toBeDefined();
      expect(currentAssets?.isGroup).toBe(true);

      const cash = savedAccounts.find((a) => a.code === '1110');
      expect(cash).toBeDefined();
      expect(cash?.parentId).toBeDefined();
      expect(cash?.isGroup).toBe(false);
    });

    it('should set all accounts as active by default', async () => {
      const tenantId = 'tenant-123';
      const savedAccounts: Account[] = [];

      mockAccountRepository.create.mockImplementation((data) => data as Account);
      mockAccountRepository.save.mockImplementation((account) => {
        savedAccounts.push(account as Account);
        return Promise.resolve(account as Account);
      });

      await service.createDefaultCOA(tenantId);

      savedAccounts.forEach((account) => {
        expect(account.isActive).toBe(true);
      });
    });
  });

  describe('getAccountHierarchy', () => {
    it('should return accounts in tree structure', async () => {
      const tenantId = 'tenant-123';
      const flatAccounts = [
        {
          id: '1',
          code: '1000',
          name: 'Assets',
          type: AccountType.ASSET,
          isGroup: true,
          parentId: null,
        },
        {
          id: '2',
          code: '1100',
          name: 'Current Assets',
          type: AccountType.ASSET,
          isGroup: true,
          parentId: '1',
        },
        {
          id: '3',
          code: '1110',
          name: 'Cash',
          type: AccountType.ASSET,
          isGroup: false,
          parentId: '2',
        },
      ];

      mockAccountRepository.find.mockResolvedValue(flatAccounts as Account[]);

      const result = await service.getAccountHierarchy(tenantId);

      // Should return root nodes only
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('1000');

      // Check children are nested
      expect(result[0].children).toBeDefined();
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].code).toBe('1100');
      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].code).toBe('1110');
    });

    it('should handle accounts without children', async () => {
      const tenantId = 'tenant-123';
      const flatAccounts = [
        {
          id: '1',
          code: '1000',
          name: 'Assets',
          type: AccountType.ASSET,
          isGroup: true,
          parentId: null,
        },
      ];

      mockAccountRepository.find.mockResolvedValue(flatAccounts as Account[]);

      const result = await service.getAccountHierarchy(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].children).toEqual([]);
    });
  });

  describe('validateAccountCode', () => {
    it('should validate unique account code within tenant', async () => {
      const tenantId = 'tenant-123';
      const code = '1000';

      mockAccountRepository.findOne.mockResolvedValue(null);

      const result = await service.validateAccountCode(code, tenantId);

      expect(result).toBe(true);
      expect(mockAccountRepository.findOne).toHaveBeenCalledWith({
        where: { tenantId, code },
      });
    });

    it('should return false if code already exists', async () => {
      const tenantId = 'tenant-123';
      const code = '1000';

      mockAccountRepository.findOne.mockResolvedValue({ id: '1', code } as Account);

      const result = await service.validateAccountCode(code, tenantId);

      expect(result).toBe(false);
    });
  });

  describe('getAccountsByType', () => {
    it('should return accounts filtered by type', async () => {
      const tenantId = 'tenant-123';
      const type = AccountType.ASSET;
      const accounts = [
        { id: '1', code: '1000', type: AccountType.ASSET },
        { id: '2', code: '1100', type: AccountType.ASSET },
      ];

      mockAccountRepository.find.mockResolvedValue(accounts as Account[]);

      const result = await service.getAccountsByType(tenantId, type);

      expect(result).toEqual(accounts);
      expect(mockAccountRepository.find).toHaveBeenCalledWith({
        where: { tenantId, type, isActive: true },
        order: { code: 'ASC' },
      });
    });
  });

  describe('getLeafAccounts', () => {
    it('should return only leaf accounts (not groups)', async () => {
      const tenantId = 'tenant-123';
      const accounts = [
        { id: '1', code: '1110', isGroup: false },
        { id: '2', code: '1120', isGroup: false },
      ];

      mockAccountRepository.find.mockResolvedValue(accounts as Account[]);

      const result = await service.getLeafAccounts(tenantId);

      expect(result).toEqual(accounts);
      expect(mockAccountRepository.find).toHaveBeenCalledWith({
        where: { tenantId, isGroup: false, isActive: true },
        order: { code: 'ASC' },
      });
    });
  });
});
