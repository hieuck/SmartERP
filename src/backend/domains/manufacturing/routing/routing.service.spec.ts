import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutingService } from './routing.service';
import { Routing } from './entities/routing.entity';
import { Operation } from './entities/operation.entity';
import { NotFoundException } from '@nestjs/common';

describe('RoutingService', () => {
  let service: RoutingService;
  let routingRepository: Repository<Routing>;
  let operationRepository: Repository<Operation>;

  const mockUser = {
    id: 'user1',
    tenantId: 'tenant1',
    roles: ['admin'],
  };

  const mockRoutingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockOperationRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingService,
        {
          provide: getRepositoryToken(Routing),
          useValue: mockRoutingRepository,
        },
        {
          provide: getRepositoryToken(Operation),
          useValue: mockOperationRepository,
        },
      ],
    }).compile();

    service = module.get<RoutingService>(RoutingService);
    routingRepository = module.get<Repository<Routing>>(getRepositoryToken(Routing));
    operationRepository = module.get<Repository<Operation>>(getRepositoryToken(Operation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a routing with operations', async () => {
      const tenantId = 'tenant1';
      const dto = {
        bomId: 'bom1',
        name: 'Standard Routing',
        operations: [
          { workCenterId: 'wc1', name: 'Cut', sequence: 1, durationExpected: 30, costPerHour: 50 },
          { workCenterId: 'wc2', name: 'Assemble', sequence: 2, durationExpected: 60, costPerHour: 40 },
        ],
      };

      const mockRouting = {
        id: 'routing1',
        tenantId,
        bomId: dto.bomId,
        name: dto.name,
        operations: [],
      };

      mockRoutingRepository.create.mockReturnValue(mockRouting);
      mockRoutingRepository.save.mockResolvedValue(mockRouting);
      
      // Mock operation creation
      mockOperationRepository.create.mockImplementation((op) => op);
      mockOperationRepository.save.mockResolvedValue(
        dto.operations.map((op, idx) => ({
          id: `op${idx}`,
          tenantId,
          routingId: 'routing1',
          ...op,
          totalCost: (op.durationExpected / 60) * op.costPerHour,
        }))
      );

      const result = await service.create(dto, tenantId, mockUser);

      expect(result.name).toBe('Standard Routing');
      expect(result.operations).toHaveLength(2);
      expect(mockRoutingRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a routing by id', async () => {
      const tenantId = 'tenant1';
      const id = 'routing1';
      const mockRouting = {
        id,
        tenantId,
        name: 'Standard Routing',
        operations: [],
      };

      mockRoutingRepository.findOne.mockResolvedValue(mockRouting);

      const result = await service.findOne(id, tenantId);

      expect(result).toEqual(mockRouting);
      expect(mockRoutingRepository.findOne).toHaveBeenCalledWith({
        where: { id, tenantId },
        relations: ['bom', 'operations', 'operations.workCenter'],
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockRoutingRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'tenant1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addOperation', () => {
    it('should add an operation to routing', async () => {
      const tenantId = 'tenant1';
      const routingId = 'routing1';
      const dto = {
        workCenterId: 'wc1',
        name: 'Polish',
        sequence: 3,
        durationExpected: 45,
        costPerHour: 35,
      };

      const mockRouting = {
        id: routingId,
        tenantId,
        operations: [],
      };

      const mockOperation = {
        id: 'op1',
        tenantId,
        routingId,
        ...dto,
        totalCost: 26.25,
      };

      mockRoutingRepository.findOne.mockResolvedValue(mockRouting);
      mockOperationRepository.create.mockReturnValue(mockOperation);
      mockOperationRepository.save.mockResolvedValue(mockOperation);

      const result = await service.addOperation(routingId, dto, tenantId, mockUser);

      expect(result.name).toBe('Polish');
      expect(result.totalCost).toBe(26.25);
      expect(mockOperationRepository.save).toHaveBeenCalled();
    });
  });
});
