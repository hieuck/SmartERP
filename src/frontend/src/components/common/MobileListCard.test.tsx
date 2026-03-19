import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MobileListCard from './MobileListCard';

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    Dropdown: ({
      children,
      menu,
    }: {
      children: React.ReactNode;
      menu?: { items?: Array<{ key: string; label?: React.ReactNode; onClick?: () => void }> };
    }) => (
      <div>
        {children}
        {menu?.items?.map((item) => (
          <button key={String(item.key)} onClick={item.onClick}>
            {item.label}
          </button>
        ))}
      </div>
    ),
  };
});

describe('MobileListCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, subtitle, tags, and fields', () => {
    render(
      <MobileListCard
        title="Camera"
        subtitle="Warehouse A"
        tags={[{ label: 'Active', color: 'green' }]}
        fields={[
          { label: 'SKU', value: 'CAM-01' },
          { label: 'Stock', value: '12' },
        ]}
      />,
    );

    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Warehouse A')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('SKU:')).toBeInTheDocument();
    expect(screen.getByText('CAM-01')).toBeInTheDocument();
    expect(screen.getByText('Stock:')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('forwards card clicks and dropdown actions', () => {
    const handleCardClick = vi.fn();
    const handleEdit = vi.fn();

    render(
      <MobileListCard
        title="Camera"
        onClick={handleCardClick}
        actions={[
          {
            key: 'edit',
            label: 'Edit',
            onClick: handleEdit,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByText('Camera'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(handleCardClick).toHaveBeenCalled();
    expect(handleEdit).toHaveBeenCalled();
  });
});
