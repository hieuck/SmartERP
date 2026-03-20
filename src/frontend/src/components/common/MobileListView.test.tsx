import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MobileListView from './MobileListView';

const { listItemActionsMock } = vi.hoisted(() => ({
  listItemActionsMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./ListItemActions', () => ({
  default: listItemActionsMock,
}));

vi.mock('antd', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: (event: { stopPropagation: () => void }) => void;
  }) => (
    <button onClick={() => onClick?.({ stopPropagation: vi.fn() })}>{children ?? 'button'}</button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Collapse: ({ items }: { items?: Array<{ key: string; label: React.ReactNode; children: React.ReactNode }> }) => (
    <div>
      {items?.map((item) => (
        <div key={item.key}>
          <div>{item.label}</div>
          <div>{item.children}</div>
        </div>
      ))}
    </div>
  ),
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
  Empty: ({ description }: { description?: React.ReactNode }) => <div>{description}</div>,
  Pagination: () => <div>pagination</div>,
  theme: {
    useToken: () => ({
      token: {
        colorPrimary: '#1677ff',
      },
    }),
  },
}));

describe('MobileListView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listItemActionsMock.mockReturnValue([]);
  });

  it('renders custom mobile items and forwards item clicks', () => {
    const handleMobileItemClick = vi.fn();

    render(
      <MobileListView
        columns={[]}
        dataSource={[{ id: '1', name: 'Camera' }]}
        mobileRenderItem={(record) => <div>custom:{record.name}</div>}
        onMobileItemClick={handleMobileItemClick}
      />,
    );

    fireEvent.click(screen.getByText('custom:Camera'));

    expect(screen.getByText('custom:Camera')).toBeInTheDocument();
    expect(handleMobileItemClick).toHaveBeenCalledWith({ id: '1', name: 'Camera' });
  });

  it('renders default card fields, fallback values, and item click handler', () => {
    const handleMobileItemClick = vi.fn();

    render(
      <MobileListView
        columns={[
          { title: 'Name', dataIndex: 'name' },
          {
            title: 'Qty',
            dataIndex: 'quantity',
            render: (value) => `Qty:${String(value)}`,
          },
          { title: 'Missing', dataIndex: 'missing' },
          { title: 'Status', dataIndex: 'status' },
          { title: 'Ignored', dataIndex: 'ignored' },
        ]}
        dataSource={[{ id: '1', name: 'Camera', quantity: 12, status: 'Active' }]}
        onMobileItemClick={handleMobileItemClick}
      />,
    );

    fireEvent.click(screen.getByText('Camera'));

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Qty')).toBeInTheDocument();
    expect(screen.getByText('Qty:12')).toBeInTheDocument();
    expect(screen.getByText('Missing')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('Ignored')).not.toBeInTheDocument();
    expect(handleMobileItemClick).toHaveBeenCalledWith({
      id: '1',
      name: 'Camera',
      quantity: 12,
      status: 'Active',
    });
  });

  it('renders mobile action dropdown items from ListItemActions', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    listItemActionsMock.mockReturnValue([
      { key: 'edit', label: 'Edit', onClick: () => handleEdit() },
      { key: 'delete', label: 'Delete', onClick: () => handleDelete() },
    ]);

    render(
      <MobileListView
        columns={[{ title: 'Name', dataIndex: 'name' }]}
        dataSource={[{ id: '1', name: 'Camera' }]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deleteConfirmTitle="Delete camera?"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(listItemActionsMock).toHaveBeenCalledWith({
      record: { id: '1', name: 'Camera' },
      onEdit: expect.any(Function),
      onDelete: expect.any(Function),
      deleteConfirmTitle: 'Delete camera?',
      isMobile: true,
    });
    expect(handleEdit).toHaveBeenCalled();
    expect(handleDelete).toHaveBeenCalled();
  });

  it('renders expandable content and empty state copy', () => {
    render(
      <MobileListView
        columns={[{ title: 'Name', dataIndex: 'name' }]}
        dataSource={[
          {
            id: '1',
            name: 'Camera',
          },
        ]}
        expandable={{
          expandedRowRender: (record) => <div>details:{record.name}</div>,
        }}
      />,
    );

    expect(screen.getByText('messages.viewMore')).toBeInTheDocument();
    expect(screen.getByText('details:Camera')).toBeInTheDocument();

    render(<MobileListView columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[]} />);

    expect(screen.getByText('messages.noData')).toBeInTheDocument();
  });
});
