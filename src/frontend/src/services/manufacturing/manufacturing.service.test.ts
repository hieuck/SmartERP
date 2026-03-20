import api from '@/services/api/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import manufacturingService from './manufacturing.service';

vi.mock('@/services/api/client');
const mockedApi = vi.mocked(api);

describe('manufacturingService.getBOMs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should unwrap envelope responses for BOM queries', async () => {
    const mockBOMs = [{ id: 'bom-1', reference: 'BOM-2026-0001' }];
    mockedApi.get = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: mockBOMs,
        message: 'Data retrieved successfully',
      },
    });

    const result = await manufacturingService.getBOMs();

    expect(mockedApi.get).toHaveBeenCalledWith('/manufacturing/bom');
    expect(result).toEqual(mockBOMs);
  });

  it('should call GET /manufacturing/bom and return data', async () => {
    const mockBOMs = [{ id: 'bom-1', reference: 'BOM-2026-0001' }];
    mockedApi.get = vi.fn().mockResolvedValue({ data: mockBOMs });

    const result = await manufacturingService.getBOMs();

    expect(mockedApi.get).toHaveBeenCalledWith('/manufacturing/bom');
    expect(result).toEqual(mockBOMs);
  });

  it('should return empty array when no BOMs exist', async () => {
    mockedApi.get = vi.fn().mockResolvedValue({ data: [] });

    const result = await manufacturingService.getBOMs();

    expect(result).toEqual([]);
  });
});

describe('manufacturingService list endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should unwrap envelope responses for work centers', async () => {
    const mockWorkCenters = [{ id: 'wc-1', code: 'CUT', name: 'Cutting Station' }];
    mockedApi.get = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: mockWorkCenters,
        message: 'Data retrieved successfully',
      },
    });

    const result = await manufacturingService.getWorkCenters();

    expect(mockedApi.get).toHaveBeenCalledWith('/manufacturing/work-centers');
    expect(result).toEqual(mockWorkCenters);
  });

  it('should unwrap envelope responses for work orders', async () => {
    const mockWorkOrders = [{ id: 'wo-1', reference: 'WO-001', qtyToProduce: 10 }];
    mockedApi.get = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: mockWorkOrders,
        message: 'Data retrieved successfully',
      },
    });

    const result = await manufacturingService.getWorkOrders();

    expect(mockedApi.get).toHaveBeenCalledWith('/manufacturing/work-orders');
    expect(result).toEqual(mockWorkOrders);
  });
});
