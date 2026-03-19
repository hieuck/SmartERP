import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExpandableContent, { createExpandableRender } from './ExpandableContent';

const { useResponsiveMock } = vi.hoisted(() => ({
  useResponsiveMock: vi.fn(),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: useResponsiveMock,
}));

describe('ExpandableContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResponsiveMock.mockReturnValue({ isMobile: false });
  });

  it('renders labels and values, with a fallback for empty values', () => {
    render(
      <ExpandableContent
        fields={[
          { label: 'SKU', value: 'CAM-01' },
          { label: 'Description', value: '' },
        ]}
      />,
    );

    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('CAM-01')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('switches to mobile layout without losing content', () => {
    useResponsiveMock.mockReturnValue({ isMobile: true });

    render(<ExpandableContent fields={[{ label: 'Warehouse', value: 'HCM' }]} />);

    expect(screen.getByText('Warehouse')).toBeInTheDocument();
    expect(screen.getByText('HCM')).toBeInTheDocument();
  });

  it('creates an expandable render helper from a record mapper', () => {
    const renderExpandable = createExpandableRender<{ code: string }>((record) => [
      { label: 'Code', value: record.code },
    ]);

    render(<div>{renderExpandable({ code: 'PRD-001' })}</div>);
    expect(screen.getByText('PRD-001')).toBeInTheDocument();
  });
});
