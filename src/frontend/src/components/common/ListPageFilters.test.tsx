import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ListPageFilters from './ListPageFilters';

const { useResponsiveMock } = vi.hoisted(() => ({
  useResponsiveMock: vi.fn(),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: useResponsiveMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ListPageFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResponsiveMock.mockReturnValue({ isMobile: false });
  });

  it('renders nothing when no search, filters, or bulk actions are provided', () => {
    const { container } = render(<ListPageFilters />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders search input and forwards search changes', () => {
    const handleSearchChange = vi.fn();

    render(
      <ListPageFilters
        searchValue=""
        onSearchChange={handleSearchChange}
        filters={<div>status-filter</div>}
        bulkActions={<button>bulk-delete</button>}
      />,
    );

    const input = screen.getByPlaceholderText('actions.search');
    fireEvent.change(input, { target: { value: 'camera' } });

    expect(handleSearchChange).toHaveBeenCalledWith('camera');
    expect(screen.getByText('status-filter')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'bulk-delete' })).toBeInTheDocument();
  });

  it('uses a custom placeholder when provided', () => {
    render(
      <ListPageFilters
        searchPlaceholder="Search products"
        searchValue=""
        onSearchChange={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText('Search products')).toBeInTheDocument();
  });
});
