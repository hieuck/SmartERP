import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PageHeader from './PageHeader';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('PageHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, subtitle, extra content, and children', () => {
    render(
      <PageHeader
        title="Products"
        subTitle="Manage catalog"
        extra={<button>create</button>}
      >
        <div>header-body</div>
      </PageHeader>,
    );

    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Manage catalog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
    expect(screen.getByText('header-body')).toBeInTheDocument();
  });

  it('uses the explicit back handler when provided', () => {
    const handleBack = vi.fn();

    render(<PageHeader title="Orders" showBack onBack={handleBack} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleBack).toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('falls back to navigate(-1) when no back handler is provided', () => {
    render(<PageHeader title="Orders" showBack />);

    fireEvent.click(screen.getByRole('button'));
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });
});
