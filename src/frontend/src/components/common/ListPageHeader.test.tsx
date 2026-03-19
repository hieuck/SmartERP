import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ListPageHeader from './ListPageHeader';

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

describe('ListPageHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResponsiveMock.mockReturnValue({ isMobile: false });
  });

  it('renders title, extra actions, and create button on desktop', () => {
    const handleCreate = vi.fn();

    render(
      <ListPageHeader
        title="Products"
        createButtonText="Create product"
        onCreateClick={handleCreate}
        extraActions={<button>refresh</button>}
      />,
    );

    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'refresh' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /create product/i }));
    expect(handleCreate).toHaveBeenCalled();
  });

  it('keeps the create action but hides the label on mobile', () => {
    const handleCreate = vi.fn();
    useResponsiveMock.mockReturnValue({ isMobile: true });

    render(<ListPageHeader title="Products" onCreateClick={handleCreate} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);

    fireEvent.click(buttons[0]);
    expect(handleCreate).toHaveBeenCalled();
    expect(screen.queryByText('actions.create')).not.toBeInTheDocument();
  });
});
