import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DesktopTableView from './DesktopTableView';

const { useResponsiveMock, getTableSizeMock, listItemActionsMock } = vi.hoisted(() => ({
  useResponsiveMock: vi.fn(),
  getTableSizeMock: vi.fn(),
  listItemActionsMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { total?: number }) =>
      key === 'messages.total' ? `${key}:${params?.total}` : key,
  }),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: useResponsiveMock,
}));

vi.mock('@/utils/responsive', () => ({
  getTableSize: getTableSizeMock,
}));

vi.mock('./ListItemActions', () => ({
  default: listItemActionsMock,
}));

vi.mock('antd', () => {
  const Table = ({
    columns,
    dataSource = [],
    rowSelection,
    pagination,
    locale,
    size,
  }: {
    columns: Array<{
      key?: string;
      title?: React.ReactNode;
      render?: (_value: unknown, record: unknown, index: number) => React.ReactNode;
    }>;
    dataSource?: unknown[];
    rowSelection?: { onChange?: (keys: React.Key[]) => void };
    pagination?:
      | false
      | {
          total: number;
          showTotal?: (total: number) => string;
        };
    locale?: { emptyText?: React.ReactNode };
    size?: string;
  }) => (
    <div>
      <div>size:{size}</div>
      {columns.map((column, index) => (
        <div key={String(column.key ?? index)}>{column.title}</div>
      ))}
      {rowSelection && (
        <button onClick={() => rowSelection.onChange?.(['1'])}>select-rows</button>
      )}
      {dataSource.length > 0
        ? columns.map((column, index) =>
            column.render ? <div key={`render-${index}`}>{column.render(undefined, dataSource[0], 0)}</div> : null,
          )
        : locale?.emptyText}
      {pagination && <div>{pagination.showTotal?.(pagination.total)}</div>}
    </div>
  );

  return {
    Empty: ({ description }: { description?: React.ReactNode }) => <div>{description}</div>,
    Table: Object.assign(Table, {
      SELECTION_ALL: 'ALL',
      SELECTION_INVERT: 'INVERT',
      SELECTION_NONE: 'NONE',
    }),
  };
});

describe('DesktopTableView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResponsiveMock.mockReturnValue({ isMobile: false });
    getTableSizeMock.mockReturnValue('middle');
    listItemActionsMock.mockImplementation(({ record }: { record: { name: string } }) => (
      <div>actions:{record.name}</div>
    ));
  });

  it('adds the actions column and wires row selection + pagination defaults', () => {
    const handleSelectionChange = vi.fn();

    render(
      <DesktopTableView
        columns={[{ title: 'Name', dataIndex: 'name' }]}
        dataSource={[{ id: '1', name: 'Camera' }]}
        enableSelection
        selectedRowKeys={['1']}
        onSelectionChange={handleSelectionChange}
        pagination={{
          current: 1,
          pageSize: 10,
          total: 7,
          onChange: vi.fn(),
        }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deleteConfirmTitle="Delete camera?"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'select-rows' }));

    expect(screen.getByText('table.actions')).toBeInTheDocument();
    expect(screen.getByText('actions:Camera')).toBeInTheDocument();
    expect(screen.getByText('messages.total:7')).toBeInTheDocument();
    expect(screen.getByText('size:middle')).toBeInTheDocument();
    expect(handleSelectionChange).toHaveBeenCalledWith(['1']);
    expect(listItemActionsMock).toHaveBeenCalledWith(
      {
        record: { id: '1', name: 'Camera' },
        onEdit: expect.any(Function),
        onDelete: expect.any(Function),
        deleteConfirmTitle: 'Delete camera?',
        isMobile: false,
      },
      expect.anything(),
    );
    expect(getTableSizeMock).toHaveBeenCalledWith({ isMobile: false });
  });

  it('renders the empty state without actions when no row actions are configured', () => {
    render(<DesktopTableView columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[]} />);

    expect(screen.getByText('messages.noData')).toBeInTheDocument();
    expect(screen.queryByText('table.actions')).not.toBeInTheDocument();
    expect(listItemActionsMock).not.toHaveBeenCalled();
  });
});
