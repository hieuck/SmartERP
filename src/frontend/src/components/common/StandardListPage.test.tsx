import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StandardListPage from './StandardListPage';

const { useResponsiveMock, getCardSizeMock } = vi.hoisted(() => ({
  useResponsiveMock: vi.fn(),
  getCardSizeMock: vi.fn(),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: useResponsiveMock,
}));

vi.mock('@/utils/responsive', () => ({
  getCardSize: getCardSizeMock,
}));

vi.mock('./ListPageHeader', () => ({
  default: ({ title }: { title: string }) => <div>header:{title}</div>,
}));

vi.mock('./ListPageFilters', () => ({
  default: ({ searchPlaceholder }: { searchPlaceholder?: string }) => (
    <div>filters:{searchPlaceholder ?? 'none'}</div>
  ),
}));

vi.mock('./DesktopTableView', () => ({
  default: ({ dataSource }: { dataSource?: Array<{ id: string }> }) => (
    <div>desktop:{dataSource?.length ?? 0}</div>
  ),
}));

vi.mock('./MobileListView', () => ({
  default: ({ dataSource }: { dataSource?: Array<{ id: string }> }) => (
    <div>mobile:{dataSource?.length ?? 0}</div>
  ),
}));

describe('StandardListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResponsiveMock.mockReturnValue({ isMobile: false });
    getCardSizeMock.mockReturnValue('default');
  });

  it('renders header, filters, custom content, and desktop view on desktop', () => {
    render(
      <StandardListPage
        title="Products"
        searchPlaceholder="Search products"
        columns={[]}
        dataSource={[{ id: '1' }, { id: '2' }]}
        customContent={<div>custom-slot</div>}
      />,
    );

    expect(screen.getByText('header:Products')).toBeInTheDocument();
    expect(screen.getByText('filters:Search products')).toBeInTheDocument();
    expect(screen.getByText('custom-slot')).toBeInTheDocument();
    expect(screen.getByText('desktop:2')).toBeInTheDocument();
    expect(screen.queryByText('mobile:2')).not.toBeInTheDocument();
    expect(getCardSizeMock).toHaveBeenCalledWith({ isMobile: false });
  });

  it('switches to the mobile view when responsive state is mobile', () => {
    useResponsiveMock.mockReturnValue({ isMobile: true });
    getCardSizeMock.mockReturnValue('small');

    render(<StandardListPage title="Orders" columns={[]} dataSource={[{ id: '1' }]} />);

    expect(screen.getByText('header:Orders')).toBeInTheDocument();
    expect(screen.getByText('mobile:1')).toBeInTheDocument();
    expect(screen.queryByText('desktop:1')).not.toBeInTheDocument();
    expect(getCardSizeMock).toHaveBeenCalledWith({ isMobile: true });
  });
});
