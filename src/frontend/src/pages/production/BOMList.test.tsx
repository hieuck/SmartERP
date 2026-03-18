import manufacturingService, { BOMType } from '@/services/manufacturing/manufacturing.service';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BOMList from './BOMList';

vi.mock('@/services/manufacturing/manufacturing.service');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockBOM = {
  id: 'bom-1',
  reference: 'BOM-2026-0001',
  productId: 'prod-1',
  product: { id: 'prod-1', name: 'Product A' },
  productQty: 10,
  type: BOMType.MANUFACTURE,
  isActive: true,
  totalCost: 500,
  unitCost: 50,
  lines: [],
  tenantId: 'tenant-1',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BOMList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call getBOMs on load', async () => {
    vi.mocked(manufacturingService.getBOMs).mockResolvedValue([mockBOM]);
    renderWithProviders(<BOMList />);
    await waitFor(() => {
      expect(manufacturingService.getBOMs).toHaveBeenCalled();
    });
  });

  it('should handle empty BOM list', async () => {
    vi.mocked(manufacturingService.getBOMs).mockResolvedValue([]);
    renderWithProviders(<BOMList />);
    await waitFor(() => {
      expect(manufacturingService.getBOMs).toHaveBeenCalled();
    });
  });
});
