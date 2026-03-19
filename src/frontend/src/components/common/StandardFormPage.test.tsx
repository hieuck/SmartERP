import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StandardFormPage from './StandardFormPage';

const { navigateMock, useResponsiveMock, getCardSizeMock, getButtonSizeMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useResponsiveMock: vi.fn(),
  getCardSizeMock: vi.fn(),
  getButtonSizeMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: useResponsiveMock,
}));

vi.mock('@/utils/responsive', () => ({
  getCardSize: getCardSizeMock,
  getButtonSize: getButtonSizeMock,
}));

describe('StandardFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResponsiveMock.mockReturnValue({ isMobile: false });
    getCardSizeMock.mockReturnValue('default');
    getButtonSizeMock.mockReturnValue('middle');
  });

  it('uses explicit callbacks for back, cancel, and save actions', () => {
    const handleBack = vi.fn();
    const handleCancel = vi.fn();
    const handleSave = vi.fn();

    render(
      <StandardFormPage
        title="Edit product"
        subtitle="Update details"
        onBack={handleBack}
        onCancel={handleCancel}
        onSave={handleSave}
      >
        <div>form-body</div>
      </StandardFormPage>,
    );

    expect(screen.getByText('Edit product')).toBeInTheDocument();
    expect(screen.getByText('Update details')).toBeInTheDocument();
    expect(screen.getByText('form-body')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /actions\.back/i }));
    fireEvent.click(screen.getByRole('button', { name: /actions\.cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /actions\.save/i }));

    expect(handleBack).toHaveBeenCalled();
    expect(handleCancel).toHaveBeenCalled();
    expect(handleSave).toHaveBeenCalled();
  });

  it('falls back to navigation helpers when callbacks are not provided', () => {
    render(
      <StandardFormPage title="Create product" backPath="/products">
        <div>body</div>
      </StandardFormPage>,
    );

    fireEvent.click(screen.getByRole('button', { name: /actions\.back/i }));
    expect(navigateMock).toHaveBeenCalledWith('/products');
  });

  it('falls back to navigate(-1) when no back handler or back path is provided', () => {
    render(
      <StandardFormPage title="Edit customer">
        <div>body</div>
      </StandardFormPage>,
    );

    fireEvent.click(screen.getByRole('button', { name: /actions\.back/i }));
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });
});
