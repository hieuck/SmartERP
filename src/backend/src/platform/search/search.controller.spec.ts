import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('SearchController', () => {
  let controller: SearchController;
  let service: SearchService;

  const mockSearchService = {
    search: jest.fn(),
    searchByType: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockTenantId = 'tenant-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('should search across all types', async () => {
      const query = 'test query';
      const mockResults = [
        { id: '1', type: 'product', title: 'Test Product', score: 0.9 },
        { id: '2', type: 'customer', title: 'Test Customer', score: 0.8 },
      ];
      mockSearchService.search.mockResolvedValue(mockResults);

      const result = await controller.search(mockUser, query);

      expect(result).toEqual(mockResults);
      expect(service.search).toHaveBeenCalledWith(mockUser, query);
    });
  });

  describe('searchByType', () => {
    it('should search by specific type', async () => {
      const type = 'product';
      const query = 'test';
      const mockResults = [
        { id: '1', type: 'product', title: 'Test Product 1', score: 0.9 },
        { id: '2', type: 'product', title: 'Test Product 2', score: 0.85 },
      ];
      mockSearchService.searchByType.mockResolvedValue(mockResults);

      const result = await controller.searchByType(mockUser, type, query);

      expect(result).toEqual(mockResults);
      expect(service.searchByType).toHaveBeenCalledWith(mockUser.tenantId, type, query);
    });
  });
});
