import api from '@/services/api/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import manufacturingService from './manufacturing.service';

vi.mock('@/services/api/client');
const mockedApi = vi.mocked(api);

describe('manufacturingService.getBOMs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
