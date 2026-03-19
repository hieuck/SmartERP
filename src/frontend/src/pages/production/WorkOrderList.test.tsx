import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkOrderList from './WorkOrderList';

const {
  navigateMock,
  standardListPageMock,
  useMutationMock,
  useQueryClientMock,
  useQueryMock,
  invalidateQueriesMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  standardListPageMock: vi.fn(),
  useMutationMock: vi.fn(),
  useQueryClientMock: vi.fn(),
  useQueryMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('dayjs', () => ({
  default: (value: unknown) => ({
    format: () => `formatted:${String(value)}`,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: useMutationMock,
  useQuery: useQueryMock,
  useQueryClient: useQueryClientMock,
}));

vi.mock('@/services/manufacturing/manufacturing.service', () => ({
  WorkOrderStatus: {
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
    DRAFT: 'DRAFT',
    IN_PROGRESS: 'IN_PROGRESS',
    READY: 'READY',
  },
  __esModule: true,
  default: {
    cancelWorkOrder: vi.fn(),
    confirmWorkOrder: vi.fn(),
    finishWorkOrder: vi.fn(),
    getWorkOrders: vi.fn(),
    startWorkOrder: vi.fn(),
  },
}));

vi.mock('@/components/common/StandardListPage', () => ({
  default: (props: {
    title: React.ReactNode;
    createButtonText: string;
    onCreateClick: () => void;
    searchPlaceholder: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    filters?: React.ReactNode;
    dataSource: Array<{ id: string; reference: string; product?: { name?: string } }>;
  }) => {
    standardListPageMock(props);
    return (
      <div>
        <div>{props.title}</div>
        <button onClick={props.onCreateClick}>{props.createButtonText}</button>
        <input
          aria-label={props.searchPlaceholder}
          value={props.searchValue}
          onChange={(event) => props.onSearchChange(event.target.value)}
        />
        <div>{props.filters}</div>
        {props.dataSource.map((item) => (
          <div key={item.id}>
            <span>{item.reference}</span>
            <span>{item.product?.name}</span>
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock('@ant-design/icons', () => ({
  CheckCircleOutlined: () => <span>icon-check</span>,
  EditOutlined: () => <span>icon-edit</span>,
  MoreOutlined: () => <span>icon-more</span>,
  PlayCircleOutlined: () => <span>icon-play</span>,
  StopOutlined: () => <span>icon-stop</span>,
  ToolOutlined: () => <span>icon-tool</span>,
}));

vi.mock('antd', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children ?? 'button'}</button>,
  Dropdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  message: {
    error: vi.fn(),
    success: vi.fn(),
  },
  Modal: {
    confirm: vi.fn(),
  },
  Select: Object.assign(
    ({
      children,
      onChange,
      placeholder,
    }: {
      children?: React.ReactNode;
      onChange?: (value?: string) => void;
      placeholder?: string;
    }) => (
      <div>
        <button onClick={() => onChange?.('READY')}>{placeholder}</button>
        {children}
      </div>
    ),
    {
      Option: ({
        children,
      }: {
        children?: React.ReactNode;
      }) => <div>{children}</div>,
    },
  ),
  Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tag: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

describe('WorkOrderList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryClientMock.mockReturnValue({
      invalidateQueries: invalidateQueriesMock,
    });
    useMutationMock.mockReturnValue({
      mutate: vi.fn(),
    });
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 'WO-1',
          product: { name: 'Laptop' },
          qtyToProduce: 10,
          reference: 'WO-001',
          status: 'READY',
        },
        {
          id: 'WO-2',
          product: { name: 'Phone' },
          qtyToProduce: 5,
          reference: 'WO-002',
          status: 'DRAFT',
        },
      ],
      isLoading: false,
    });
  });

  it('renders the queried work orders through the standard list shell', () => {
    render(<WorkOrderList />);

    expect(screen.getByText('WO-001')).toBeInTheDocument();
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('WO-002')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
  });

  it('filters work orders by search term and status', () => {
    render(<WorkOrderList />);

    fireEvent.change(screen.getByLabelText('workOrders.searchPlaceholder'), {
      target: { value: '002' },
    });

    expect(screen.queryByText('WO-001')).not.toBeInTheDocument();
    expect(screen.getByText('WO-002')).toBeInTheDocument();

    fireEvent.click(screen.getByText('filters.status'));

    expect(screen.queryByText('WO-002')).not.toBeInTheDocument();
  });

  it('navigates to the create route from the create action', () => {
    render(<WorkOrderList />);

    fireEvent.click(screen.getByText('workOrders.create'));

    expect(navigateMock).toHaveBeenCalledWith('/dashboard/production/work-orders/new');
  });
});
