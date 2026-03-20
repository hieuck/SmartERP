import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkCenterList from './WorkCenterList';

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

vi.mock('@tanstack/react-query', () => ({
  useMutation: useMutationMock,
  useQuery: useQueryMock,
  useQueryClient: useQueryClientMock,
}));

vi.mock('@/services/manufacturing/manufacturing.service', () => ({
  __esModule: true,
  default: {
    deleteWorkCenter: vi.fn(),
    getWorkCenters: vi.fn(),
    updateWorkCenter: vi.fn(),
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
    dataSource: Array<{ id: string; code: string; name: string }>;
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
        {props.dataSource.map((item) => (
          <div key={item.id}>
            <span>{item.code}</span>
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock('@ant-design/icons', () => ({
  DeleteOutlined: () => <span>icon-delete</span>,
  EditOutlined: () => <span>icon-edit</span>,
  MoreOutlined: () => <span>icon-more</span>,
  SettingOutlined: () => <span>icon-setting</span>,
}));

vi.mock('antd', () => ({
  App: Object.assign(
    ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    {
      useApp: () => ({
        message: {
          error: vi.fn(),
          success: vi.fn(),
        },
        modal: {
          confirm: vi.fn(),
        },
      }),
    },
  ),
  Button: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children ?? 'button'}</button>,
  Dropdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Modal: {
    confirm: vi.fn(),
  },
  Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Switch: () => <input type="checkbox" />,
  Tag: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

describe('WorkCenterList', () => {
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
          id: 'WC-1',
          code: 'CUT',
          name: 'Cutting Station',
          isActive: true,
        },
        {
          id: 'WC-2',
          code: 'ASM',
          name: 'Assembly Line',
          isActive: false,
        },
      ],
      isLoading: false,
    });
  });

  it('renders the queried work centers through the standard list shell', () => {
    render(<WorkCenterList />);

    expect(screen.getByText('CUT')).toBeInTheDocument();
    expect(screen.getByText('Cutting Station')).toBeInTheDocument();
    expect(screen.getByText('ASM')).toBeInTheDocument();
    expect(screen.getByText('Assembly Line')).toBeInTheDocument();
  });

  it('filters work centers by the search term', () => {
    render(<WorkCenterList />);

    fireEvent.change(screen.getByLabelText('workCenter.searchPlaceholder'), {
      target: { value: 'asm' },
    });

    expect(screen.queryByText('CUT')).not.toBeInTheDocument();
    expect(screen.getByText('ASM')).toBeInTheDocument();
  });

  it('navigates to the create route from the create action', () => {
    render(<WorkCenterList />);

    fireEvent.click(screen.getByText('workCenter.create'));

    expect(navigateMock).toHaveBeenCalledWith('/dashboard/production/work-centers/new');
  });
});
