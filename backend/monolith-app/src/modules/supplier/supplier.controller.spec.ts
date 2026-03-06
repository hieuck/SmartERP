import { Test, TestingModule } from '@nestjs/testing';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

describe('SupplierController', () => {
  let controller: SupplierController;
  let service: SupplierService;

  const mockSupplierService = {
    findAll: jest.fn(),
    search: jest.fn(),
    findByStatus: jest.fn(),
    getTopSuppliers: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateBalance: jest.fn(),
    updatePaymentTerms: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    remove: jest.fn(),
  };

  const mockTenantId = 'tenant-123';
  const mockSupplierId = 'supplier-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierController],
      providers: [
        {
          provide: SupplierService,
          useValue: mockSupplierService,
        },
      ],
    }).compile();

    controller = module.get<SupplierController>(SupplierController);
    service = module.get<SupplierService>(SupplierService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all suppliers', async () => {
      const mockSuppliers = [
        { id: '1', name: 'Supplier A', status: 'active' },
        { id: '2', name: 'Supplier B', status: 'active' },
      ];
      mockSupplierService.findAll.mockResolvedValue(mockSuppliers);

      const result = await controller.findAll(mockTenantId);

      expect(result).toEqual(mockSuppliers);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('search', () => {
    it('should search suppliers by query', async () => {
      const query = 'supplier';
      const mockResults = [{ id: '1', name: 'Supplier A' }];
      mockSupplierService.search.mockResolvedValue(mockResults);

      const result = await controller.search(query, mockTenantId);

      expect(result).toEqual(mockResults);
      expect(service.search).toHaveBeenCalledWith(query, mockTenantId);
    });
  });

  describe('findByStatus', () => {
    it('should return suppliers by status', async () => {
      const status = 'active';
      const mockSuppliers = [{ id: '1', name: 'Supplier A', status }];
      mockSupplierService.findByStatus.mockResolvedValue(mockSuppliers);

      const result = await controller.findByStatus(status, mockTenantId);

      expect(result).toEqual(mockSuppliers);
      expect(service.findByStatus).toHaveBeenCalledWith(status, mockTenantId);
    });
  });

  describe('getTopSuppliers', () => {
    it('should return top suppliers', async () => {
      const limit = 10;
      const mockSuppliers = [
        { id: '1', name: 'Supplier A', balance: 10000 },
        { id: '2', name: 'Supplier B', balance: 8000 },
      ];
      mockSupplierService.getTopSuppliers.mockResolvedValue(mockSuppliers);

      const result = await controller.getTopSuppliers(limit, mockTenantId);

      expect(result).toEqual(mockSuppliers);
      expect(service.getTopSuppliers).toHaveBeenCalledWith(limit, mockTenantId);
    });
  });

  describe('count', () => {
    it('should return supplier count', async () => {
      const mockCount = 50;
      mockSupplierService.count.mockResolvedValue(mockCount);

      const result = await controller.count(mockTenantId);

      expect(result).toEqual(mockCount);
      expect(service.count).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('findOne', () => {
    it('should return supplier by id', async () => {
      const mockSupplier = { id: mockSupplierId, name: 'Supplier A' };
      mockSupplierService.findOne.mockResolvedValue(mockSupplier);

      const result = await controller.findOne(mockSupplierId, mockTenantId);

      expect(result).toEqual(mockSupplier);
      expect(service.findOne).toHaveBeenCalledWith(mockSupplierId, mockTenantId);
    });
  });

  describe('create', () => {
    it('should create new supplier', async () => {
      const createDto: CreateSupplierDto = {
        name: 'New Supplier',
        email: 'supplier@example.com',
        phone: '0123456789',
        address: '123 Street',
      } as CreateSupplierDto;
      const mockCreated = { id: mockSupplierId, ...createDto };
      mockSupplierService.create.mockResolvedValue(mockCreated);

      const result = await controller.create(createDto, mockTenantId);

      expect(result).toEqual(mockCreated);
      expect(service.create).toHaveBeenCalledWith(createDto, mockTenantId);
    });
  });

  describe('update', () => {
    it('should update supplier', async () => {
      const updateDto: UpdateSupplierDto = {
        name: 'Updated Supplier',
      };
      const mockUpdated = { id: mockSupplierId, ...updateDto };
      mockSupplierService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update(mockSupplierId, updateDto, mockTenantId);

      expect(result).toEqual(mockUpdated);
      expect(service.update).toHaveBeenCalledWith(mockSupplierId, updateDto, mockTenantId);
    });
  });

  describe('updateBalance', () => {
    it('should update supplier balance', async () => {
      const amount = 5000;
      const mockUpdated = { id: mockSupplierId, balance: amount };
      mockSupplierService.updateBalance.mockResolvedValue(mockUpdated);

      const result = await controller.updateBalance(mockSupplierId, amount, mockTenantId);

      expect(result).toEqual(mockUpdated);
      expect(service.updateBalance).toHaveBeenCalledWith(mockSupplierId, amount, mockTenantId);
    });
  });

  describe('updatePaymentTerms', () => {
    it('should update supplier payment terms', async () => {
      const paymentTerms = 30;
      const mockUpdated = { id: mockSupplierId, paymentTerms };
      mockSupplierService.updatePaymentTerms.mockResolvedValue(mockUpdated);

      const result = await controller.updatePaymentTerms(mockSupplierId, paymentTerms, mockTenantId);

      expect(result).toEqual(mockUpdated);
      expect(service.updatePaymentTerms).toHaveBeenCalledWith(mockSupplierId, paymentTerms, mockTenantId);
    });
  });

  describe('activate', () => {
    it('should activate supplier', async () => {
      const mockActivated = { id: mockSupplierId, status: 'active' };
      mockSupplierService.activate.mockResolvedValue(mockActivated);

      const result = await controller.activate(mockSupplierId, mockTenantId);

      expect(result).toEqual(mockActivated);
      expect(service.activate).toHaveBeenCalledWith(mockSupplierId, mockTenantId);
    });
  });

  describe('deactivate', () => {
    it('should deactivate supplier', async () => {
      const mockDeactivated = { id: mockSupplierId, status: 'inactive' };
      mockSupplierService.deactivate.mockResolvedValue(mockDeactivated);

      const result = await controller.deactivate(mockSupplierId, mockTenantId);

      expect(result).toEqual(mockDeactivated);
      expect(service.deactivate).toHaveBeenCalledWith(mockSupplierId, mockTenantId);
    });
  });

  describe('remove', () => {
    it('should delete supplier', async () => {
      mockSupplierService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockSupplierId, mockTenantId);

      expect(result).toEqual({ message: 'Supplier deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockSupplierId, mockTenantId);
    });
  });
});
