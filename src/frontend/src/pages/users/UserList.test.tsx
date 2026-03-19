import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserList from './UserList';

const {
  getAllMock,
  getQueueSizeMock,
  isSyncingMock,
  messageMock,
  navigateMock,
  standardListPageMock,
} = vi.hoisted(() => ({
  getAllMock: vi.fn(),
  getQueueSizeMock: vi.fn(),
  isSyncingMock: vi.fn(),
  messageMock: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
  navigateMock: vi.fn(),
  standardListPageMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.defaultValue ? String(options.defaultValue) : key,
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

vi.mock('@/lib/logger/logger.service', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/services/offline-services', () => ({
  offlineServices: {
    users: {
      delete: vi.fn(),
      getAll: getAllMock,
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/offline/sync-manager', () => ({
  syncManager: {
    getQueueSize: getQueueSizeMock,
    isSyncing: isSyncingMock,
    sync: vi.fn(),
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
    dataSource: Array<{ id: string; email: string }>;
    extraActions?: React.ReactNode;
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
        <div>{props.extraActions}</div>
        {props.dataSource.map((user) => (
          <div key={user.id}>{user.email}</div>
        ))}
      </div>
    );
  },
}));

vi.mock('@ant-design/icons', () => ({
  CloudOutlined: () => <span>icon-cloud</span>,
  DeleteOutlined: () => <span>icon-delete</span>,
  DisconnectOutlined: () => <span>icon-disconnect</span>,
  EditOutlined: () => <span>icon-edit</span>,
  EyeOutlined: () => <span>icon-eye</span>,
  LockOutlined: () => <span>icon-lock</span>,
  MoreOutlined: () => <span>icon-more</span>,
  SyncOutlined: ({ spin }: { spin?: boolean }) => <span>{spin ? 'icon-sync-spin' : 'icon-sync'}</span>,
  UserOutlined: () => <span>icon-user</span>,
}));

vi.mock('antd', () => ({
  Badge: ({ children, text }: { children?: React.ReactNode; text?: React.ReactNode }) => (
    <div>
      {text}
      {children}
    </div>
  ),
  Button: ({
    children,
    disabled,
    onClick,
  }: {
    children?: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button disabled={disabled} onClick={onClick}>
      {children ?? 'button'}
    </button>
  ),
  Dropdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  message: messageMock,
  Modal: {
    confirm: vi.fn(),
  },
  Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tag: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

describe('UserList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllMock.mockResolvedValue([
      {
        id: '1',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Admin',
        role: 'ADMIN',
        status: 'active',
        createdAt: '2026-03-01',
      },
      {
        id: '2',
        email: 'bob@example.com',
        firstName: 'Bob',
        lastName: 'Viewer',
        role: 'VIEWER',
        status: 'inactive',
        createdAt: '2026-03-02',
      },
    ]);
    getQueueSizeMock.mockResolvedValue(2);
    isSyncingMock.mockReturnValue(false);
    vi.mocked(global.localStorage.getItem).mockReturnValue(null);
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  it('loads users from offline storage and renders the initial list', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(getAllMock).toHaveBeenCalled();
    });

    expect(getQueueSizeMock).toHaveBeenCalled();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('users:createButton')).toBeInTheDocument();
  });

  it('filters the rendered users when the search term changes', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('users:searchPlaceholder'), {
      target: { value: 'bob' },
    });

    await waitFor(() => {
      expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
    });

    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('navigates to the new-user route from the create action', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('users:createButton')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('users:createButton'));

    expect(navigateMock).toHaveBeenCalledWith('/dashboard/users/new');
  });
});
