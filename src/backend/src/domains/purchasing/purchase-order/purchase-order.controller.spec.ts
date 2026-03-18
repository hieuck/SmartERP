import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';

const mockUser = { id: 'user-1', tenantId: 'tenant-1', role: 'admin' };

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  updateStatus: jest.fn(),
  findBySupplier: jest.fn(),
  findByStatus: jest.fn(),
  getStatistics: jest.fn(),
};

describe('PurchaseOrderController', () => {
  let controller: PurchaseOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrderController],
      providers: [{ provide: PurchaseOrderService, useValue: mockService }],
    }).compile();

    controller = module.get<PurchaseOrderController>(PurchaseOrderController);
    jest.clearAllMocks();
  });

  it('should call findAll with correct params', async () => {
    mockService.findAll.mockResolvedValue({ data: [], meta: {} });
    await controller.findAll(mockUser as any, 1, 20);
    expect(mockService.findAll).toHaveBeenCalledWith(mockUser, 1, 20);
  });

  it('should call findOne', async () => {
    mockService.findOne.mockResolvedValue({ id: 'po-1' });
    await controller.findOne(mockUser as any, 'po-1');
    expect(mockService.findOne).toHaveBeenCalledWith(mockUser, 'po-1');
  });

  it('should call create', async () => {
    const dto = { poNumber: 'PO-001', supplierId: 's-1', items: [] };
    mockService.create.mockResolvedValue({ id: 'po-1', ...dto });
    await controller.create(mockUser as any, dto as any);
    expect(mockService.create).toHaveBeenCalledWith(mockUser, dto);
  });

  it('should call update', async () => {
    mockService.update.mockResolvedValue({ id: 'po-1' });
    await controller.update(mockUser as any, 'po-1', { notes: 'test' } as any);
    expect(mockService.update).toHaveBeenCalledWith(mockUser, 'po-1', { notes: 'test' });
  });

  it('should call remove and return message', async () => {
    mockService.remove.mockResolvedValue(undefined);
    const result = await controller.remove(mockUser as any, 'po-1');
    expect(result).toEqual({ message: 'Purchase order deleted successfully' });
  });

  it('should call updateStatus', async () => {
    mockService.updateStatus.mockResolvedValue({ id: 'po-1', status: 'confirmed' });
    await controller.updateStatus(mockUser as any, 'po-1', 'confirmed');
    expect(mockService.updateStatus).toHaveBeenCalledWith(mockUser, 'po-1', 'confirmed');
  });

  it('should call getStatistics', async () => {
    mockService.getStatistics.mockResolvedValue({ totalOrders: 0 });
    await controller.getStatistics(mockUser as any);
    expect(mockService.getStatistics).toHaveBeenCalledWith(mockUser);
  });
});
