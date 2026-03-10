import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingService } from './accounting.service';
import { Account, AccountType } from './entities/account.entity';
import { Invoice } from './entities/invoice.entity';
import { JournalEntry } from './entities/journal-entry.entity';

describe('AccountingService - Security Integration', () => {
  let service: AccountingService;
  let accountRepository: Repository<Account>;
  let permissionService: PermissionService;

  const mockUser: User = { id: 'user-1', tenantId: 'tenant-1', roles: ['user'] };
  const mockAdmin: User = { id: 'admin-1', tenantId: 'tenant-1', roles: ['admin'] };
  const mockAccount: Account = {
    id: 'account-1',
    code: '1000',
    name: 'Cash',
    type: AccountType.ASSET,
    balance: 1000,
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    isGroup: false,
    isActive: true,
    currency: 'VND',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        {
          provide: getRepositoryToken(Account),
          useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), remove: jest.fn() },
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), count: jest.fn() },
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), remove: jest.fn() },
        },
        { provide: CacheService, useValue: { getOrSet: jest.fn((k, fn) => fn()), del: jest.fn() } },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn(),
            canWrite: jest.fn(),
            canDelete: jest.fn(),
            buildSecureQuery: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get<AccountingService>(AccountingService);
    accountRepository = module.get<Repository<Account>>(getRepositoryToken(Account));
    permissionService = module.get<PermissionService>(PermissionService);
  });

  describe('findAllAccounts - Security', () => {
    it('should filter by tenant automatically', async () => {
      jest.spyOn(permissionService, 'buildSecureQuery').mockReturnValue({ tenantId: 'tenant-1' });
      jest.spyOn(accountRepository, 'find').mockResolvedValue([mockAccount]);
      const result = await service.findAllAccounts(mockUser);
      expect(permissionService.buildSecureQuery).toHaveBeenCalled();
      expect(result).toEqual([mockAccount]);
    });
  });

  describe('findAccountById - Security', () => {
    it('should throw ForbiddenException if cannot read', async () => {
      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockAccount);
      jest.spyOn(permissionService, 'canRead').mockReturnValue(false);
      await expect(service.findAccountById(mockUser, 'account-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return account if can read', async () => {
      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockAccount);
      jest.spyOn(permissionService, 'canRead').mockReturnValue(true);
      const result = await service.findAccountById(mockUser, 'account-1');
      expect(result).toEqual(mockAccount);
    });
  });

  describe('createAccount - Security', () => {
    it('should inject tenantId and createdBy', async () => {
      const newAccount = { code: '2000', name: 'Bank', type: AccountType.ASSET };
      jest.spyOn(permissionService, 'canWrite').mockReturnValue(true);
      jest.spyOn(accountRepository, 'save').mockResolvedValue({ ...mockAccount, ...newAccount });
      await service.createAccount(mockUser, newAccount);
      expect(accountRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', createdBy: 'user-1' }),
      );
    });
  });

  describe('updateAccount - Security', () => {
    it('should throw ForbiddenException if cannot write', async () => {
      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockAccount);
      jest.spyOn(permissionService, 'canRead').mockReturnValue(true);
      jest.spyOn(permissionService, 'canWrite').mockReturnValue(false);
      await expect(
        service.updateAccount(mockUser, 'account-1', { name: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteAccount - Security', () => {
    it('should throw ForbiddenException if cannot delete', async () => {
      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockAccount);
      jest.spyOn(permissionService, 'canRead').mockReturnValue(true);
      jest.spyOn(permissionService, 'canDelete').mockReturnValue(false);
      await expect(service.deleteAccount(mockUser, 'account-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
